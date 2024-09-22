import { useEffect, useState } from 'react';
import './App.css';

interface Employee {
    userId: string;
    userName: string;
    userLastName: string;
    projectName: string;
    projectId: string;
}

function App() {
    const [employee, setEmployee] = useState<Employee>();
    const [count, setCount] = useState<number>(0);
    const [id, setId] = useState<string>("");

    useEffect(() => {
        searchEmployee();
    }, []);

    const contents = employee === undefined
        ? <p><em>Loading... Please refresh once the ASP.NET backend has started. See <a href="https://aka.ms/jspsintegrationreact">https://aka.ms/jspsintegrationreact</a> for more details.</em></p>
        : <table className="table-rounded table-stripped table" aria-labelledby="tableLabel">
            <thead className="table-dark">
                <tr>
                    <th>Id</th>
                    <th>First name</th>
                    <th>Last name</th>
                    <th>Project</th>
                    <th>Project id</th>
                </tr>
            </thead>
            <tbody>
                <tr key={employee.userId}>
                    <td>{employee.userId}</td>
                    <td>{employee.userName}</td>
                    <td>{employee.userLastName}</td>
                    <td>{employee.projectName}</td>
                    <td>{employee.projectId}</td>
                </tr>
            </tbody>
        </table>;

    return (
        <div>
            <button onClick={() => setCount(count + 1)}>Count: {count}</button>
            <h1 id="tableLabel">Employee Details</h1>
            <p>This component demonstrates fetching data from the server.</p>
            <button onClick={searchEmployee}>Search</button>
            <input placeholder="Employee id" onChange={(evt) => setId(evt.currentTarget.value) } />
            {contents}

        </div>
    );

    async function searchEmployee() {

        if (id != "") {
            const response = await fetch(`${import.meta.env.VITE_API_URL_Prod}/employee/getemployeebyid`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify( id )
            });
            const employee: Employee = await response.json();

            setEmployee(employee);
        }
    }
}

export default App;