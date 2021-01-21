var table = document.getElementById('table');

axios.get('http://localhost:5000/chatbot/data').then(data => {
    console.log(data);
    nodes = data.data.data;
    console.log(nodes);
    for(let i = 0; i < nodes.length; i++){
        let tr = document.createElement('tr');
        let td1 = document.createElement('td');
        let td2 = document.createElement('td');
        let td3 = document.createElement('td');
        let td4 = document.createElement('td');
        let chatBtn = document.createElement('button');
        let viewBtn = document.createElement('button');
        chatBtn.classList.add('btn','chat-btn');
        viewBtn.classList.add('btn','view-btn');
        chatBtn.addEventListener('click', () => {
            console.log(nodes[i].id);
            localStorage.setItem('query', nodes[i].VA_Name);
            console.log(localStorage.getItem('query'));
            location.href = 'http://localhost:5000/chatbot';
        });

        viewBtn.addEventListener('click', () => {
            let bot = JSON.stringify(nodes[i]);
            localStorage.setItem('shape', bot);
            location.href = 'http://localhost:5000';
        });

        chatBtn.innerText = 'Chat';
        viewBtn.innerText = 'View';
        td1.innerText = nodes[i].VA_Name;
        td2.innerText = nodes[i].VA_Id;
        td3.appendChild(chatBtn);
        td4.appendChild(viewBtn);
        tr.append(td1, td2, td3, td4);
        table.appendChild(tr);
    }
});