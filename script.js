// Firebase SDK import
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-analytics.js";
import { getDatabase, ref, push, set, remove, onValue } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js";

// Firebase 설정
const firebaseConfig = {
    apiKey: "AIzaSyCME3Bis0-TAg8WYEV5e6L1-2fvVx5-GJQ",
    authDomain: "pilseong-todo-backend.firebaseapp.com",
    projectId: "pilseong-todo-backend",
    storageBucket: "pilseong-todo-backend.firebasestorage.app",
    messagingSenderId: "152864911704",
    appId: "1:152864911704:web:dbc101a4fda644eb96b52d",
    databaseURL: "https://pilseong-todo-backend-default-rtdb.firebaseio.com/",
    measurementId: "G-TLD6T27KZ1"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getDatabase(app);

class TodoApp {
    constructor() {
        this.todos = [];
        this.todoInput = document.getElementById('todoInput');
        this.addBtn = document.getElementById('addBtn');
        this.todoList = document.getElementById('todoList');
        this.editingId = null;

        // Firebase Realtime Database 참조
        this.todosRef = ref(db, 'todos');

        this.addBtn.addEventListener('click', () => this.addTodo());
        this.todoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTodo();
        });

        // 실시간 데이터 리스너 설정
        this.setupRealtimeListener();
    }

    setupRealtimeListener() {
        onValue(this.todosRef, (snapshot) => {
            this.todos = [];
            const data = snapshot.val();
            if (data) {
                Object.keys(data).forEach(key => {
                    this.todos.push({
                        id: key,
                        ...data[key]
                    });
                });
            }
            this.render();
        });
    }

    addTodo() {
        const text = this.todoInput.value.trim();
        if (!text) {
            alert('할일을 입력하세요!');
            return;
        }

        const newTodoRef = push(this.todosRef);
        set(newTodoRef, {
            text: text,
            completed: false,
            createdAt: Date.now()
        });

        this.todoInput.value = '';
    }

    deleteTodo(id) {
        const todoRef = ref(db, `todos/${id}`);
        remove(todoRef);
    }

    toggleComplete(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            const todoRef = ref(db, `todos/${id}`);
            set(todoRef, {
                text: todo.text,
                completed: !todo.completed,
                createdAt: todo.createdAt
            });
        }
    }

    startEdit(id) {
        this.editingId = id;
        this.render();
    }

    saveTodo(id, newText) {
        const text = newText.trim();
        if (!text) {
            alert('할일을 입력하세요!');
            return;
        }

        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            const todoRef = ref(db, `todos/${id}`);
            set(todoRef, {
                text: text,
                completed: todo.completed,
                createdAt: todo.createdAt
            });
            this.editingId = null;
            this.render();
        }
    }

    cancelEdit() {
        this.editingId = null;
        this.render();
    }

    render() {
        this.todoList.innerHTML = '';

        if (this.todos.length === 0) {
            this.todoList.innerHTML = '<li style="text-align: center; color: #999; padding: 20px;">할일을 추가해보세요!</li>';
            return;
        }

        // 생성 시간순으로 정렬
        const sortedTodos = [...this.todos].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

        sortedTodos.forEach(todo => {
            const li = document.createElement('li');
            li.className = `todo-item ${todo.completed ? 'completed' : ''}`;

            if (this.editingId === todo.id) {
                li.innerHTML = `
                    <div class="edit-form">
                        <input 
                            type="text" 
                            class="edit-input" 
                            value="${todo.text}" 
                            id="editInput"
                            autofocus
                        >
                        <button class="save-btn">저장</button>
                        <button class="cancel-btn">취소</button>
                    </div>
                `;

                const saveBtn = li.querySelector('.save-btn');
                const cancelBtn = li.querySelector('.cancel-btn');
                const input = li.querySelector('#editInput');

                saveBtn.addEventListener('click', () => {
                    this.saveTodo(todo.id, input.value);
                });

                cancelBtn.addEventListener('click', () => {
                    this.cancelEdit();
                });

                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.saveTodo(todo.id, input.value);
                    }
                });
            } else {
                li.innerHTML = `
                    <input 
                        type="checkbox" 
                        class="todo-checkbox"
                        ${todo.completed ? 'checked' : ''}
                    >
                    <span class="todo-text">${this.escapeHtml(todo.text)}</span>
                    <div class="todo-actions">
                        <button class="edit-btn">수정</button>
                        <button class="delete-btn">삭제</button>
                    </div>
                `;

                const checkbox = li.querySelector('.todo-checkbox');
                const editBtn = li.querySelector('.edit-btn');
                const deleteBtn = li.querySelector('.delete-btn');

                checkbox.addEventListener('change', () => {
                    this.toggleComplete(todo.id);
                });

                editBtn.addEventListener('click', () => {
                    this.startEdit(todo.id);
                });

                deleteBtn.addEventListener('click', () => {
                    this.deleteTodo(todo.id);
                });
            }

            this.todoList.appendChild(li);
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

new TodoApp();
