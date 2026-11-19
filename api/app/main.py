import os
from contextlib import asynccontextmanager
from pathlib import Path
from datetime import date, timedelta

from fastapi import Depends, FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import func, text
from sqlmodel import Session, select

from . import models as m
from .crud import crud_router
from .db import engine, get_session, init_db


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield


app = FastAPI(title="HomeCtl API", version="1.0.0", root_path_in_servers=False, lifespan=lifespan)

API = "/api"
app.include_router(crud_router(m.InventoryItem, m.InventoryBase, m.InventoryUpdate, f"{API}/inventory", "estoque", m.InventoryItem.name))
app.include_router(crud_router(m.ShoppingItem, m.ShoppingBase, m.ShoppingUpdate, f"{API}/shopping", "compras", m.ShoppingItem.done))
app.include_router(crud_router(m.Task, m.TaskBase, m.TaskUpdate, f"{API}/tasks", "afazeres", m.Task.done))
app.include_router(crud_router(m.Bill, m.BillBase, m.BillUpdate, f"{API}/bills", "contas", m.Bill.due_date))
app.include_router(crud_router(m.Transaction, m.TransactionBase, m.TransactionUpdate, f"{API}/transactions", "financeiro", m.Transaction.date.desc()))


# ---------- Ações de negócio ----------
@app.post(f"{API}/inventory/restock-list", tags=["estoque"])
def restock_list(session: Session = Depends(get_session)):
    """Coloca na lista de compras os itens abaixo do estoque mínimo (sem duplicar)."""
    low = session.exec(select(m.InventoryItem).where(m.InventoryItem.quantity < m.InventoryItem.min_quantity)).all()
    pending = {s.name.lower() for s in session.exec(select(m.ShoppingItem).where(m.ShoppingItem.done == False)).all()}  # noqa: E712
    added = []
    for item in low:
        if item.name.lower() in pending:
            continue
        session.add(m.ShoppingItem(name=item.name, quantity=item.min_quantity - item.quantity, unit=item.unit, category=item.category))
        added.append(item.name)
    session.commit()
    return {"added": added}


@app.post(f"{API}/bills/{{bill_id}}/pay", response_model=m.Bill, tags=["contas"])
def pay_bill(bill_id: int, session: Session = Depends(get_session)):
    """Marca a conta como paga, lança a despesa e, se recorrente, cria a do próximo mês."""
    bill = session.get(m.Bill, bill_id)
    if not bill:
        raise HTTPException(404, "conta não encontrada")
    if bill.paid:
        raise HTTPException(409, "conta já paga")
    bill.paid = True
    session.add(m.Transaction(description=f"Conta: {bill.name}", amount=bill.amount, kind=m.Kind.expense, category=bill.category, date=date.today()))
    if bill.recurring:
        due = bill.due_date
        year, month = (due.year + 1, 1) if due.month == 12 else (due.year, due.month + 1)
        day = min(due.day, 28)
        session.add(m.Bill(name=bill.name, amount=bill.amount, due_date=date(year, month, day), category=bill.category, recurring=True))
    session.add(bill)
    session.commit()
    session.refresh(bill)
    return bill


@app.get(f"{API}/summary", tags=["dashboard"])
def summary(session: Session = Depends(get_session)):
    today = date.today()
    month_start = today.replace(day=1)

    def total(kind: m.Kind) -> float:
        stmt = select(func.coalesce(func.sum(m.Transaction.amount), 0)).where(m.Transaction.kind == kind, m.Transaction.date >= month_start)
        return float(session.exec(stmt).one())

    income, expense = total(m.Kind.income), total(m.Kind.expense)
    bills_due = session.exec(
        select(m.Bill).where(m.Bill.paid == False, m.Bill.due_date <= today + timedelta(days=7)).order_by(m.Bill.due_date)  # noqa: E712
    ).all()
    low_stock = session.exec(select(m.InventoryItem).where(m.InventoryItem.quantity < m.InventoryItem.min_quantity)).all()
    expiring = session.exec(
        select(m.InventoryItem).where(m.InventoryItem.expires_on != None, m.InventoryItem.expires_on <= today + timedelta(days=7))  # noqa: E711
    ).all()
    open_tasks = session.exec(select(func.count()).select_from(m.Task).where(m.Task.done == False)).one()  # noqa: E712
    shopping = session.exec(select(func.count()).select_from(m.ShoppingItem).where(m.ShoppingItem.done == False)).one()  # noqa: E712
    return {
        "month": {"income": income, "expense": expense, "balance": income - expense},
        "bills_due": bills_due,
        "low_stock": low_stock,
        "expiring": expiring,
        "open_tasks": open_tasks,
        "shopping_pending": shopping,
    }


# ---------- Probes para o Kubernetes ----------
@app.get("/healthz", include_in_schema=False)
def healthz():
    return {"status": "ok"}


@app.get("/readyz", include_in_schema=False)
def readyz():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(503, f"db indisponível: {exc.__class__.__name__}")
    return {"status": "ready"}


# ---------- Front (SPA) servido pela própria API ----------
# Precisa ficar por ÚLTIMO: a rota curinga não pode engolir /api, /healthz e /readyz.
STATIC_DIR = os.getenv("STATIC_DIR", str(Path(__file__).resolve().parent.parent / "static"))

if os.path.isdir(STATIC_DIR):
    if os.path.isdir(f"{STATIC_DIR}/assets"):
        app.mount("/assets", StaticFiles(directory=f"{STATIC_DIR}/assets"), name="assets")

    @app.get("/{path:path}", include_in_schema=False)
    def spa(path: str):
        if path.startswith("api/"):
            raise HTTPException(404, "rota de API inexistente")
        candidate = (Path(STATIC_DIR) / path).resolve()
        # bloqueia path traversal (../) e devolve index.html para rotas do SPA
        if path and candidate.is_file() and candidate.is_relative_to(Path(STATIC_DIR).resolve()):
            return FileResponse(candidate)
        return FileResponse(f"{STATIC_DIR}/index.html", headers={"Cache-Control": "no-cache"})
