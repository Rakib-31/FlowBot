const popup = document.querySelector('.chat-popup');
const chatBtn = document.querySelector('.chat-btn');
const submitBtn = document.querySelector('.submit');
const chatArea = document.querySelector('.chat-area');
const inputElm = document.getElementById('input-field');
const botAvatarUrl = 'avatar.jpg';
const userAvatarUrl = 'avatar.jpg';
console.log(location.href);
var nodes = null;
var query = localStorage.getItem('query');
var url = 'http://localhost:5000/chatbot/data';
if(query){
    url = 'http://localhost:5000/chatbot/data/' + query;
    popup.classList.add('show');
}
console.log(JSON.stringify(query));
axios.get(url).then(data => {
    console.log(data);
    nodes = JSON.parse(data.data.data[0].nodes);
    console.log(nodes);
    pushQuestion(nodes[0]);
});

var tempNode = null;


const pushQuestion = (node) => {
    tempNode = node;
    console.log(node );

    let botImg = makeAvatar(botAvatarUrl, 'avatar');

    let question = document.createElement('div');
    question.setAttribute('class', 'income-msg');
    question.appendChild(botImg);
    let span = document.createElement('span');
    span.setAttribute('class', 'msg');
    span.innerHTML = node.question;
    question.appendChild(span);

    chatArea.appendChild(question);

    if(node.responses.length) {
        inputElm.readOnly = true;
        let wrapper = document.createElement('div');
        wrapper.setAttribute('id', 'wrapper');

        for(let i = 0; i < node.responses.length; i++){
            const firstResponse = document.createElement('div');
            const button = document.createElement('button');
            button.classList.add('design', 'btn-msg');
            button.innerHTML = node.responses[i].name;

            button.addEventListener('click', () => {
                nextQuestionHandler(node, node.responses[i]);
            });
            firstResponse.appendChild(button);
            wrapper.appendChild(firstResponse);
        }
        chatArea.appendChild(wrapper);
    } else {
        inputElm.readOnly = false;
    }
    
}

const nextQuestionHandler = (node, response) => {
    userMessageHandler(response.name);
    if(node.nextNodeId !== null){
        console.log('in next');
        findNode(node.nextNodeId);
    } else if(node.nextBot !== null){
        console.log('in bot');
        nextBotController(node.nextBot);
    } else if(node.chatEnded){
        chatEndedHandler();
    }
    else if(response.nextNodeId !== null){
        console.log('in next');
        findNode(response.nextNodeId);
    } else if(response.nextBot !== null){
        nextBotController(response.nextBot);
    } else if(response.chatEnded){
        chatEndedHandler();
    }

    let removeResponse = document.getElementById('wrapper');
    console.log(removeResponse);
    chatArea.removeChild(removeResponse);
}

const findNode = (nodeId) => {
    let node = nodes.filter(res => res.questionId === nodeId)[0];
    pushQuestion(node);
}

const makeAvatar = (avatarUrl, design) => {
    var avatar = document.createElement('img');
    avatar.classList.add(design);
    avatar.src = avatarUrl;
    return avatar;
}

const createHtmlELement = (design, text) => {
    let botImg = makeAvatar(botAvatarUrl, 'avatar');
    let thanks = document.createElement('div');
    thanks.classList.add('income-msg');
    thanks.appendChild(botImg);
    let span = document.createElement('span');
    span.setAttribute('class', 'msg');
    span.innerHTML = text;
    thanks.appendChild(span);

    chatArea.appendChild(thanks);
}

const nextBotController = (bot) => {
    console.log('in bot controller');
    createHtmlELement('bot-control', 'Go to ' + bot);
}

const chatEndedHandler = () => {
    createHtmlELement('chat-end-control', 'Thank you.');
}

const userMessageHandler = (userInput) => {
    let userImg = makeAvatar(userAvatarUrl, 'avatar');

    let outMessage = document.createElement('div');
    outMessage.setAttribute('class', 'out-msg');

    let myMessage  = document.createElement('span');
    myMessage.classList.add('design', 'my-msg');
    myMessage.innerHTML = userInput;
    
    outMessage.appendChild(myMessage);
    outMessage.appendChild(userImg);

    chatArea.appendChild(outMessage);
    inputElm.value = '';
}

chatBtn.addEventListener('click', () => {
    popup.classList.toggle('show');
});

const userSubmitHandler = () => {
    let userInput = inputElm.value;
    userMessageHandler(userInput);
    if(tempNode.nextNodeId !== null){
        findNode(tempNode.nextNodeId);
    } else if(tempNode.nextBot !== null){
        nextBotController(tempNode.nextBot);
    } else if(tempNode.chatEnded){
        chatEndedHandler();
    }
}

submitBtn.addEventListener('click', () => {
    userSubmitHandler();
});

inputElm.addEventListener('keydown', function(e) {
    if(e.keyCode == 13 && !inputElm.readOnly){
        userSubmitHandler();
    }
});
