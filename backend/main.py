from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from pydantic import BaseModel
from dataclasses import dataclass
import psycopg2
from enum import Enum
from fastapi.responses import JSONResponse
import json

app = FastAPI()

# CORS settings
origins = [
    "http://localhost",
    "http://localhost:3000",  # Add the URL of your frontend
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database connection
conn = psycopg2.connect(
    user="postgres",
    password="Fi3445supabase",
    host="db.ucekfljadhripdgtdziw.supabase.co",
    port=5432,
    database="postgres",
)

with conn.cursor() as cursor:
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS books (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            state VARCHAR(255) NOT NULL
        );
    """)
conn.commit()

@dataclass
class Book:
    id: int
    title: str
    state: str

class BookCreate(BaseModel):
    title: str

class UpdateBookRequest(BaseModel):
    new_state: str

class BookRepository:
    def create_book(self, title: str, state: str) -> int:
        with conn.cursor() as cursor:
            cursor.execute(
                "INSERT INTO books(title, state) VALUES (%s, %s) RETURNING id",
                (title, state),
            )
            book_id = cursor.fetchone()[0]
        conn.commit()
        return book_id

    def get_all_books(self) -> List[Book]:
        with conn.cursor() as cursor:
            cursor.execute("SELECT id, title, state FROM books")
            books = [Book(*row) for row in cursor.fetchall()]
        return books

    def get_book_by_id(self, book_id: int) -> Book:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT id, title, state FROM books WHERE id = %s", (book_id,)
            )
            row = cursor.fetchone()
            if row:
                return Book(*row)
            else:
                raise HTTPException(status_code=404, detail="Book not found")

    def update_book_state(self, book_id: int, state: str) -> None:
        with conn.cursor() as cursor:
            cursor.execute(
                "UPDATE books SET state = %s WHERE id = %s",
                (state, book_id),
            )
        conn.commit()

    def delete_book(self, book_id: int) -> None:
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM books WHERE id = %s", (book_id,))
        conn.commit()

book_repo = BookRepository()

@app.post("/books/", response_model=dict)
async def create_book(book: BookCreate):
    book_id = book_repo.create_book(book.title, "to-read")
    return {"id": book_id}

@app.get("/books/", response_model=List[Book])
async def read_books():
    return book_repo.get_all_books()

@app.get("/books/{book_id}", response_model=Book)
async def read_book(book_id: int):
    return book_repo.get_book_by_id(book_id)

@app.put("/books/{book_id}", response_model=dict)
async def update_book(book_id: int, request: UpdateBookRequest):
    try:
        # Validate that the state is one of the allowed values
        valid_states = ['to-read', 'in-progress', 'completed']
        if request.new_state not in valid_states:
            raise HTTPException(status_code=422, detail="Invalid state")

        # Update the book state
        book_repo.update_book_state(book_id, request.new_state)
        return {"message": "Book updated successfully"}
    except HTTPException as e:
        return JSONResponse(content=json.dumps({"error": e.detail}), status_code=e.status_code)

@app.delete("/books/{book_id}", response_model=dict)
async def delete_book(book_id: int):
    book_repo.delete_book(book_id)
    return {"message": "Book deleted successfully"}
