"""Fábrica de rotas CRUD: evita repetir o mesmo código para cada entidade."""
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlmodel import Session, SQLModel, select

from .db import get_session


def crud_router(model, create_schema, update_schema, prefix: str, tag: str, order_by=None) -> APIRouter:
    router = APIRouter(prefix=prefix, tags=[tag])

    def _get(session: Session, item_id: int):
        obj = session.get(model, item_id)
        if not obj:
            raise HTTPException(404, f"{tag} {item_id} não encontrado")
        return obj

    @router.get("", response_model=list[model])
    def list_items(session: Session = Depends(get_session)):
        stmt = select(model)
        if order_by is not None:
            stmt = stmt.order_by(order_by)
        return session.exec(stmt).all()

    @router.post("", response_model=model, status_code=201)
    def create(data: create_schema, session: Session = Depends(get_session)):  # type: ignore[valid-type]
        obj = model.model_validate(data)
        session.add(obj)
        session.commit()
        session.refresh(obj)
        return obj

    @router.get("/{item_id}", response_model=model)
    def read(item_id: int, session: Session = Depends(get_session)):
        return _get(session, item_id)

    @router.patch("/{item_id}", response_model=model)
    def update(item_id: int, data: update_schema, session: Session = Depends(get_session)):  # type: ignore[valid-type]
        obj = _get(session, item_id)
        obj.sqlmodel_update(data.model_dump(exclude_unset=True))
        session.add(obj)
        session.commit()
        session.refresh(obj)
        return obj

    @router.delete("/{item_id}", status_code=204)
    def delete(item_id: int, session: Session = Depends(get_session)):
        session.delete(_get(session, item_id))
        session.commit()
        return Response(status_code=204)

    return router
