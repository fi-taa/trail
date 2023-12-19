"use client"
import React, { useState, useEffect } from 'react';
import AddBookForm from '../components/AddBookForm';
import BookList from '../components/BookList';
import NavBar from '@/components/Nav';

interface Book {
  id: number;
  title: string;
  state: 'to-read' | 'in-progress' | 'completed';
}

const Home: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);

  useEffect(() => {
    // Fetch books from the backend when the component mounts
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      const response = await fetch('http://localhost:8000/books');
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      setBooks(data);
    } catch (error) {
      console.error('Error fetching books:', error);
    }
  };
  

  const handleAddBook = async (title: string) => {
    try {
      const response = await fetch('http://localhost:8000/books', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, state: 'to-read' }), // Ensure 'state' is included in the request body
      });
  
      if (response.ok) {
        // If the book is successfully added, fetch the updated list of books
        fetchBooks();
      } else {
        const data = await response.json();
        console.error('Error adding book:', data);
      }
    } catch (error) {
      console.error('Error adding book:', error);
    }
  };

  const handleMoveBook = async (bookId: number, newState: 'to-read' | 'in-progress' | 'completed') => {
    try {
        const response = await fetch(`http://localhost:8000/books/${bookId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ new_state: newState }), // Send the new state in the request body
        });

        if (response.ok) {
            fetchBooks();
        } else {
            const data = await response.json();
            console.error('Error moving book:', data);
        }
    } catch (error) {
        console.error('Error moving book:', error);
    }
};

  
  
  const handleDeleteBook = async (bookId: number) => {
    try {
      const response = await fetch(`http://localhost:8000/books/${bookId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // If the book is successfully deleted, fetch the updated list of books
        fetchBooks();
      } else {
        console.error('Error deleting book:', response.statusText);
      }
    } catch (error) {
      console.error('Error deleting book:', error);
    }
  };

  return (
    <div className="flex flex-col items-center  min-h-screen">
      <NavBar />
      {/* Add Book Form */}
      <div className="mb-8 flex flex-col justify-center items-center">
        <h2 className="text-xl font-bold mb-4">Add a Book</h2>
        <AddBookForm onAddBook={handleAddBook} />
      </div>
       {/* Brief Text Section */}
    <div className="mb-4 text-center">
      <p className="text-sm">
        Manage your books easily! Add a book using the form above.
        Use buttons to change status or delete a book.
      </p>
    </div>

    {/* Button Functionality Images */}
    <div className="flex justify-around gap-3 mb-8">
      <div className="flex flex-col items-center">
        <img src="/move.png" alt="Move Icon" className="w-6" />
        <p className="text-xs">Change status</p>
      </div>
      <div className="flex flex-col items-center">
      <img src="/delete.png" alt="" className='w-6' />
        <p className="text-xs">Delete a book</p>
      </div>
    </div>

      {/* Table */}
      <div className="flex items-center justify-around w-4/5 space-x-4">
        <div className="flex-1">
          <div className="flex flex-col h-96">
            <h2 className="text-xl font-bold mb-4">To Read</h2>
            <BookList
              books={books.filter((book) => book.state === 'to-read')}
              onMoveBook={handleMoveBook}
              onDeleteBook={handleDeleteBook}
            />
          </div>
        </div>

        <div className="flex-1">
          <div className="flex flex-col h-96">
            <h2 className="text-xl font-bold mb-4">Reading</h2>
            <BookList
              books={books.filter((book) => book.state === 'in-progress')}
              onMoveBook={handleMoveBook}
              onDeleteBook={handleDeleteBook}
            />
          </div>
        </div>

        <div className="flex-1">
          <div className="flex flex-col h-96">
            <h2 className="text-xl font-bold mb-4">Completed</h2>
            <BookList
              books={books.filter((book) => book.state === 'completed')}
              onMoveBook={handleMoveBook}
              onDeleteBook={handleDeleteBook}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
