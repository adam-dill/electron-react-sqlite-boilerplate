import React, {useState, useEffect} from 'react';
import ReactDOM from 'react-dom';
const { ipcRenderer } = window.require("electron");

const App = () => {
    const [todo, setTodo] = useState([]);
    const [completed, setCompleted] = useState([]);
    const [addLabel, setAddLabel] = useState('');
    const [url, setUrl] = useState();

    useEffect(() => {
        ipcRenderer.on('response', processResponse);
        fetchData();
    }, [url]);

    const fetchData = () => {
        ipcRenderer.send('query', {
            url: url,
            sql: 'SELECT * FROM list'
        });
    }

    const processResponse = (_, response) => {
        setTodo(response.filter(value => value.status === 1));
        setCompleted(response.filter(value => value.status === 0));
    }

    const handleItemClick = (id) => {
        // find the item
        let item = todo.find(value => value.id === id);
        if (!item) item = completed.find(value => value.id === id);
        if (!item) {
            console.error('item not found', id);
            return;
        }
        const newStatus = item.status > 0 ? 0 : 1;
        // update the status of the record
        ipcRenderer.send('mutate', {
            url: url,
            sql: `UPDATE list SET status=${newStatus} WHERE id=${id}`
        });
        // refresh the data
        fetchData();
    }

    const handleDeleteItemClick = (id) => {
        ipcRenderer.send('mutate', {
            url: url,
            sql: `DELETE FROM list WHERE id=${id}`
        });
        // refresh the data
        fetchData();
    }

    const handleAddItemClick = () => {
        ipcRenderer.send('mutate', {
            url: url,
            sql: `INSERT INTO list (label) VALUES ('${addLabel}')`
        });
        setAddLabel('');
        fetchData();
    }

    const handleFileChange = (e) => {
        if (!e.target.files.length) return;
        
        const url = e.target.files[0].path;
        setUrl(url);
    }

    const renderItem = (value) => {
        return (
            <li key={value.id}>
                <button onClick={() => handleDeleteItemClick(value.id)}>X</button>
                <input type='checkbox' onClick={() => handleItemClick(value.id)} />
                {value.label}
            </li>
        )
    }
    return (
        <>
            <input type="file" onChange={handleFileChange} />
            <hr />
            <input type="text" value={addLabel} onChange={(e) => setAddLabel(e.target.value)} />
            <button onClick={handleAddItemClick} disabled={addLabel.trim() === ''}>Add</button>
            <h2>Todo</h2>
            <ul>{todo.map(renderItem)}</ul>
            <h2>Completed</h2>
            <ul>{completed.map(renderItem)}</ul>
        </>
    )
};
ReactDOM.render(<App />, document.getElementById('app'));