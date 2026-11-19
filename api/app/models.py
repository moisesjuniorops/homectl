from datetime import date
from enum import Enum
from typing import Optional

from pydantic import create_model
from sqlmodel import Field, SQLModel


def update_schema(base: type[SQLModel]) -> type:
    """Gera um schema de PATCH com todos os campos opcionais."""
    fields = {name: (Optional[f.annotation], None) for name, f in base.model_fields.items()}
    return create_model(f"{base.__name__}Update", **fields)


# ---------- Estoque ----------
class InventoryBase(SQLModel):
    name: str = Field(index=True, min_length=1)
    category: str = "Geral"
    quantity: float = Field(default=0, ge=0)
    unit: str = "un"
    min_quantity: float = Field(default=0, ge=0)
    location: str = "Despensa"
    expires_on: Optional[date] = None


class InventoryItem(InventoryBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)


# ---------- Lista de compras ----------
class ShoppingBase(SQLModel):
    name: str = Field(min_length=1)
    quantity: float = Field(default=1, ge=0)
    unit: str = "un"
    category: str = "Geral"
    done: bool = False


class ShoppingItem(ShoppingBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)


# ---------- Afazeres ----------
class Priority(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"


class TaskBase(SQLModel):
    title: str = Field(min_length=1)
    notes: str = ""
    due_date: Optional[date] = None
    priority: Priority = Priority.medium
    done: bool = False


class Task(TaskBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)


# ---------- Contas a pagar ----------
class BillBase(SQLModel):
    name: str = Field(min_length=1)
    amount: float = Field(ge=0)
    due_date: date
    category: str = "Casa"
    recurring: bool = False
    paid: bool = False


class Bill(BillBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)


# ---------- Financeiro ----------
class Kind(str, Enum):
    income = "income"
    expense = "expense"


class TransactionBase(SQLModel):
    description: str = Field(min_length=1)
    amount: float = Field(gt=0)
    kind: Kind = Kind.expense
    category: str = "Geral"
    date: date


class Transaction(TransactionBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)


InventoryUpdate = update_schema(InventoryBase)
ShoppingUpdate = update_schema(ShoppingBase)
TaskUpdate = update_schema(TaskBase)
BillUpdate = update_schema(BillBase)
TransactionUpdate = update_schema(TransactionBase)
