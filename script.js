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
        this.tablePreview = document.getElementById('tablePreview');
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
        
        // textarea 자동 높이 조절 및 미리보기 업데이트
        this.todoInput.addEventListener('input', () => {
            this.todoInput.style.height = 'auto';
            this.todoInput.style.height = this.todoInput.scrollHeight + 'px';
            this.updatePreview();
        });

        // 붙여넣기 이벤트 처리
        this.todoInput.addEventListener('paste', () => {
            setTimeout(() => {
                this.todoInput.style.height = 'auto';
                this.todoInput.style.height = this.todoInput.scrollHeight + 'px';
                this.updatePreview();
            }, 0);
        });

        // 미리보기 클릭 이벤트 설정
        this.tablePreview.addEventListener('click', () => {
            this.tablePreview.style.display = 'none';
            this.todoInput.style.display = 'block';
            this.todoInput.focus();
        });

        // 실시간 데이터 리스너 설정
        this.setupRealtimeListener();
    }

    // 입력창 미리보기 업데이트
    updatePreview() {
        const text = this.todoInput.value.trim();
        
        if (this.isMarkdownTable(text) || this.isTabTable(text)) {
            this.tablePreview.innerHTML = this.formatText(text);
            this.tablePreview.style.display = 'block';
            this.todoInput.style.display = 'none';
        } else {
            this.tablePreview.style.display = 'none';
            this.todoInput.style.display = 'block';
        }
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
        this.tablePreview.style.display = 'none';
        this.todoInput.style.display = 'block';
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

    // 탭으로 구분된 텍스트인지 확인
    isTabTable(text) {
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length < 1) return false;
        
        const hasTab = lines.some(line => line.includes('\t'));
        if (!hasTab) return false;
        
        const firstLineCols = lines[0].split('\t').length;
        return firstLineCols >= 2;
    }

    // 마크다운 표 형식인지 확인 (| 분류 | 재료 | 비고 |)
    isMarkdownTable(text) {
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length < 2) return false;
        
        // 첫 번째 줄이 | 로 시작하고 끝나는지 확인
        const firstLine = lines[0].trim();
        if (!firstLine.startsWith('|') || !firstLine.endsWith('|')) return false;
        
        // 구분선이 있는지 확인 (| --- | --- | 형태)
        const hasSeperator = lines.some(line => {
            const trimmed = line.trim();
            return trimmed.includes('---') && trimmed.includes('|');
        });
        
        return hasSeperator;
    }

    // 탭으로 구분된 텍스트를 HTML 테이블로 변환
    convertTabToTable(text) {
        const lines = text.split('\n').filter(line => line.trim());
        let html = '<table class="todo-table">';
        
        lines.forEach((line, index) => {
            const cells = line.split('\t');
            html += '<tr>';
            cells.forEach(cell => {
                const tag = index === 0 ? 'th' : 'td';
                html += `<${tag}>${this.escapeHtml(cell.trim())}</${tag}>`;
            });
            html += '</tr>';
        });
        
        html += '</table>';
        return html;
    }

    // 마크다운 표를 HTML 테이블로 변환
    convertMarkdownToTable(text) {
        const lines = text.split('\n').filter(line => line.trim());
        let html = '<table class="todo-table">';
        let isHeader = true;
        
        lines.forEach((line) => {
            const trimmed = line.trim();
            
            // 구분선 (| --- | --- |) 건너뛰기
            if (trimmed.includes('---') && trimmed.includes('|')) {
                isHeader = false;
                return;
            }
            
            // | 로 분리하고 앞뒤 빈 요소 제거
            let cells = trimmed.split('|');
            cells = cells.filter((cell, index) => {
                // 첫 번째와 마지막 빈 요소 제거
                if (index === 0 && cell.trim() === '') return false;
                if (index === cells.length - 1 && cell.trim() === '') return false;
                return true;
            });
            
            html += '<tr>';
            cells.forEach(cell => {
                const tag = isHeader ? 'th' : 'td';
                // **굵은글씨** 처리
                let cellText = this.escapeHtml(cell.trim());
                cellText = cellText.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
                html += `<${tag}>${cellText}</${tag}>`;
            });
            html += '</tr>';
        });
        
        html += '</table>';
        return html;
    }

    // 텍스트를 포맷팅 (테이블 또는 일반 텍스트)
    formatText(text) {
        if (this.isMarkdownTable(text)) {
            return this.convertMarkdownToTable(text);
        }
        if (this.isTabTable(text)) {
            return this.convertTabToTable(text);
        }
        return this.escapeHtml(text).replace(/\n/g, '<br>');
    }
}

new TodoApp();
