from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import asc, desc, or_, select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductRead, ProductUpdate

router = APIRouter(prefix="/products", tags=["products"])


def get_product_or_404(product_id: int, db: Session) -> Product:
    product = db.get(Product, product_id)

    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )

    return product


@router.post("", response_model=ProductRead, status_code=status.HTTP_201_CREATED)
def create_product(product_in: ProductCreate, db: Session = Depends(get_db)) -> Product:
    existing_product = db.scalar(
        select(Product).where(
            Product.name == product_in.name,
            Product.merchant == product_in.merchant,
            Product.purchase_date == product_in.purchase_date,
        )
    )

    if existing_product is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A matching product already exists.",
        )

    product = Product(**product_in.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.get("", response_model=list[ProductRead])
def list_products(
    db: Session = Depends(get_db),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    search: str | None = Query(default=None, max_length=255),
    include_archived: bool = Query(default=False),
    sort_by: str = Query(
        default="created_at",
        pattern="^(created_at|name|return_deadline|warranty_deadline)$",
    ),
    sort_direction: str = Query(default="desc", pattern="^(asc|desc)$"),
) -> list[Product]:
    statement = select(Product)

    if not include_archived:
        statement = statement.where(Product.is_archived.is_(False))

    if search:
        search_pattern = f"%{search.strip()}%"

        statement = statement.where(
            or_(
                Product.name.ilike(search_pattern),
                Product.merchant.ilike(search_pattern),
                Product.notes.ilike(search_pattern),
                Product.warranty_provider.ilike(search_pattern),
                Product.warranty_notes.ilike(search_pattern),
            )
        )

    sort_columns = {
        "created_at": Product.created_at,
        "name": Product.name,
        "return_deadline": Product.return_deadline,
        "warranty_deadline": Product.warranty_deadline,
    }

    sort_column = sort_columns[sort_by]
    order_expression = asc(sort_column) if sort_direction == "asc" else desc(sort_column)

    statement = statement.order_by(order_expression).limit(limit).offset(offset)

    return list(db.scalars(statement).all())


@router.get("/{product_id}", response_model=ProductRead)
def get_product(product_id: int, db: Session = Depends(get_db)) -> Product:
    return get_product_or_404(product_id, db)


@router.patch("/{product_id}", response_model=ProductRead)
def update_product(
    product_id: int,
    product_in: ProductUpdate,
    db: Session = Depends(get_db),
) -> Product:
    product = get_product_or_404(product_id, db)

    update_data = product_in.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(product, field, value)

    db.add(product)
    db.commit()
    db.refresh(product)

    return product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: int, db: Session = Depends(get_db)) -> None:
    product = get_product_or_404(product_id, db)

    db.delete(product)
    db.commit()


@router.post("/{product_id}/archive", response_model=ProductRead)
def archive_product(
    product_id: int,
    db: Session = Depends(get_db),
) -> Product:
    product = get_product_or_404(product_id, db)

    product.is_archived = True

    db.add(product)
    db.commit()
    db.refresh(product)

    return product


@router.post(
    "/{product_id}/restore",
    response_model=ProductRead,
)
def restore_product(
    product_id: int,
    db: Session = Depends(get_db),
) -> Product:
    product = get_product_or_404(product_id, db)

    product.is_archived = False

    db.add(product)
    db.commit()
    db.refresh(product)

    return product