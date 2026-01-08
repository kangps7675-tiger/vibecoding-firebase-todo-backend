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
        this.todoInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.addTodo();
            }
        });
        
        // textarea 자동 높이 조절
        this.todoInput.addEventListener('input', () => {
            this.todoInput.style.height = 'auto';
            this.todoInput.style.height = this.todoInput.scrollHeight + 'px';
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
        this.todoInput.style.height = 'auto';
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
                li.className = 'todo-item editing';
                li.innerHTML = `
                    <div class="edit-form">
                        <textarea 
                            class="edit-input" 
                            id="editInput"
                            autofocus
                        >${todo.text}</textarea>
                        <div class="edit-buttons">
                            <button class="save-btn">저장</button>
                            <button class="cancel-btn">취소</button>
                        </div>
                    </div>
                `;

                const saveBtn = li.querySelector('.save-btn');
                const cancelBtn = li.querySelector('.cancel-btn');
                const textarea = li.querySelector('#editInput');

                // textarea 높이 자동 조절
                textarea.style.height = 'auto';
                textarea.style.height = textarea.scrollHeight + 'px';

                textarea.addEventListener('input', () => {
                    textarea.style.height = 'auto';
                    textarea.style.height = textarea.scrollHeight + 'px';
                });

                saveBtn.addEventListener('click', () => {
                    this.saveTodo(todo.id, textarea.value);
                });

                cancelBtn.addEventListener('click', () => {
                    this.cancelEdit();
                });

                textarea.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        this.saveTodo(todo.id, textarea.value);
                    }
                });
            } else {
                li.innerHTML = `
                    <input 
                        type="checkbox" 
                        class="todo-checkbox"
                        ${todo.completed ? 'checked' : ''}
                    >
                    <span class="todo-text">${this.formatText(todo.text)}</span>
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

    // 탭으로 구분된 텍스트를 테이블인지 확인
    isTableData(text) {
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length < 1) return false;
        
        // 각 줄에 탭이 있는지 확인
        const hasTab = lines.some(line => line.includes('\t'));
        if (!hasTab) return false;
        
        // 최소 2개 이상의 열이 있어야 함
        const firstLineCols = lines[0].split('\t').length;
        return firstLineCols >= 2;
    }

    // 탭으로 구분된 텍스트를 HTML 테이블로 변환
    convertToTable(text) {
        const lines = text.split('\n').filter(line => line.trim());
        let html = '<table class="todo-table">';
        
        lines.forEach((line, index) => {
            const cells = line.split('\t');
            html += '<tr>';
            cells.forEach(cell => {
                // 첫 번째 줄은 헤더로 처리
                const tag = index === 0 ? 'th' : 'td';
                html += `<${tag}>${this.escapeHtml(cell.trim())}</${tag}>`;
            });
            html += '</tr>';
        });
        
        html += '</table>';
        return html;
    }

    // 텍스트를 포맷팅 (테이블 또는 일반 텍스트)
    formatText(text) {
        if (this.isTableData(text)) {
            return this.convertToTable(text);
        }
        return this.escapeHtml(text).replace(/\n/g, '<br>');
    }
}

new TodoApp();
