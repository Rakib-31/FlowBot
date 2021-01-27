localStorage.setItem('query', '');
var parentId = null;
var slink = [];
var nodeId = 1;
var nodeArray = [{ id: nodeId, type: 'Start', tags: ['Start'], name: "Press the button to ask any query",type: null, questionNode: null }];
var flowBot = {tenant:"emma", VA_Name:"", VA_Id:100, nodes: [], shape: nodeArray, slink};
var questionArray = null;
var saveUrl = 'http://localhost:5000/post';
var dataArray;

axios.get( './data.json' ).then( data =>{ 
    questionArray = data.data.data;
    dataArray = questionArray.questions;
});

console.log(flowBot);


var searchBar = document.getElementById('search-bar');
var modal = document.getElementById("myModal");
let questionOption = document.getElementById('question-option');


var span = document.getElementsByClassName("close")[0];
span.onclick = function() {
    modal.style.display = "none";
}


function autocomplete(inp, dataArray) {
    var currentFocus;
    inp.addEventListener("input", function(e) {
        var val = this.value;
        closeAllLists();
        if (!val) { return false; }
        currentFocus = -1;
        itemContainerDiv = document.createElement("div");
        itemContainerDiv.setAttribute("id", this.id + "autocomplete-list");
        itemContainerDiv.setAttribute("class", "autocomplete-items");
        this.parentNode.appendChild(itemContainerDiv);

        for (let i = 0; i < dataArray.length; i++) {
            if (dataArray[i].text.toUpperCase().includes(val.toUpperCase())) {
                itemDiv = document.createElement("div");
                itemDiv.style.textAlign = 'left';
                itemDiv.innerHTML = dataArray[i].text;
                itemDiv.setAttribute('id', dataArray[i].questionId);
                itemDiv.addEventListener('click', function(e) {
                    var index = parseInt(this.getAttribute('id'));
                    questionHandler(index);
                }, false);
                itemContainerDiv.appendChild(itemDiv);
            }
        }
    });

    
    inp.addEventListener("keydown", function(e) {
        var x = document.getElementById(this.id + "autocomplete-list");
        if (x) x = x.getElementsByTagName("div");
        if (e.keyCode == 40) {      
            currentFocus++;
            addActive(x);
        } else if (e.keyCode == 38) {   
            currentFocus--;
            addActive(x);
        } else if (e.keyCode == 13) {
            e.preventDefault();
            if (currentFocus > -1) {
                if (x) x[currentFocus].click();
            }
        }
    });


    function addActive(x) {
        if (!x) return false;
        removeActive(x);
        if (currentFocus >= x.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = (x.length - 1);
        x[currentFocus].classList.add("autocomplete-active");
    }

    function removeActive(x) {
        for (var i = 0; i < x.length; i++) {
            x[i].classList.remove("autocomplete-active");
        }
    }

    function closeAllLists(elmnt) {
        var x = document.getElementsByClassName("autocomplete-items");
        for (var i = 0; i < x.length; i++) {
            if (elmnt != x[i] && elmnt != inp) {
                x[i].parentNode.removeChild(x[i]);
            }
        }
    }

    document.addEventListener("click", function(e) {
        closeAllLists(e.target);
    });
}


const endSessionHandler = (id) => {
    let endNode = getNode(id);

    if(endNode.type === 'Response'){
        let endParentNode = getNode(endNode.pid);
        let responseNode = getResponseNode(endParentNode, endNode);
        responseNode.chatEnded = true;

    } else if (endNode.type === 'Question') {
        endNode.questionNode.chatEnded = true;
    } else {
        let obj = {
            id: endNode.id, 
            nextNodeId: null, 
            condition: null, 
            chatEnded: true, 
            nextBot: null
        }
        let parent = getNode(endNode.pid);
        if(parent.type === 'Question'){
            parent.questionNode.hasRules.push(obj);
        } else {
            let parentOfParent = getNode(parent.pid);
            let response = getResponseNode(parentOfParent, parent);
            response.hasRules.push(obj);
        }
        parent.complete = true;
    }

    console.log(JSON.stringify(flowBot));

    nodeArray.push({id: 0,tags: ['End'], pid: id, name: 'End Session', questionNode: {questionId: null}});
    endNode.complete = true;
    console.log(JSON.stringify(nodeArray));
    chart.draw();
}


const getNode = (id) => {
    return nodeArray.filter(result => result.id === id)[0];
}

const getResponseNode = (parent, current) => {
    let responseNode = parent.questionNode.responses.filter(res => res.name === current.name)[0];
    return responseNode;
}

const removePopup = document.getElementById('remove-popup');
document.getElementById('remove-popup-btn').addEventListener('click', () => {
    removePopup.style.display = 'none';
});

const openRemoveCurrentNextNodePopup = () => {
    removePopup.style.display = 'flex';
}

const getNewNode = (questionObject) => {
    return {
        id: ++nodeId,
        pid: parentId,
        tags: ['Question'],
        name: questionObject.text,
        type: 'Question',
        questionNode: null,
        complete: false,
        right: 0
    }
}

const setNextNodeIdIfResponse = (node, questionObject) => {
    let anotherNode = getNode(node.pid);   
    let responseNode = getResponseNode(anotherNode, node);
    responseNode.nextNodeId = questionObject.questionId;
    node.nextNodeId = questionObject.questionId;
}

const setNextNodeIdIfQuestion = (node,newNode) => {
    let len = node.questionNode.responses.length;
    if(len){
        let index = nodeArray.indexOf(node);
        console.log(index);
        newNode.right = (len % 2) ? len/2 + 1 : len/2;
        nodeArray.splice(index+len/2 + 1 + node.right,0,newNode);
        nodeArray.splice(nodeArray.length - 1, 1);
    }
    node.questionNode.nextNodeId = questionObject.questionId;
}

const setNextNodeIdIfCondition = (node, questionObject) => {
    parentOfCondition = getNode(node.pid);
    if(parentOfCondition.type === 'Question'){
        parentOfCondition.questionNode.hasRules.push({
            id: node.id, 
            nextNodeId: questionObject.questionId, 
            condition: null, 
            chatEnded: null, 
            nextBot: null
        });
    } else if(parentOfCondition.type === 'Response'){
        let responseParent = getNode(parentOfCondition.pid);
        let response = getResponseNode(responseParent, parentOfCondition);
        response.hasRules.push({id: node.id, nextNodeId: questionObject.questionId, condition: null});
    }
    parentOfCondition.complete = true;
}

const pushResponseElementsIntoNodeArray = (questionObject, responseArray, newNode) => {
    for(let i = 0; i < questionObject.responses.length; i++){
        nodeArray.push({
            id: ++nodeId,
            pid: newNode.id,
            parentQid: questionObject.questionId,
            tags: ['Response'],
            name: questionObject.responses[i].name,
            type: 'Response',
            nextNodeId: null,
            complete: false
        });
        responseArray.push({
            nodeType: 'Response',
            responseId: responseArray.length,
            name: questionObject.responses[i].name,
            hasRules: [],
            nextNodeId: null,
            nextBot: null,
            chatEnded: false
        });
    }
}

const getObjectOfQuestion = (questionObject, responseArray) => {
    return {
        questionId: questionObject.questionId,
        questionType: questionObject.typeName,
        question: questionObject.text,
        NodeType: 'Question',
        hasRules: [],
        nextNodeId: null,
        nextBot: null,
        chatEnded: false,
        responseType: questionObject.responseType,
        responses: responseArray
    }
}

function questionHandler(index) { 
    var questionObject = dataArray.filter(res => res.questionId === index)[0];
    console.log(questionObject);
    let newNode = getNewNode(questionObject);
    let node = getNode(parentId);
    nodeArray.push(newNode);

    if(node.type === 'Response'){
        setNextNodeIdIfResponse(node, questionObject);
        
    } else if(node.type === 'Question'){
        setNextNodeIdIfQuestion(node, newNode);
    } else if(node.type === 'Condition') {
        setNextNodeIdIfCondition(node, questionObject);
    }
    questionObject.responses.sort((a,b) => {return a.viewOrder - b.viewOrder});
    var responseArray = [];

    pushResponseElementsIntoNodeArray(questionObject, responseArray, newNode);

    let questionNodeObject = getObjectOfQuestion(questionObject, responseArray);

    newNode.questionNode = questionNodeObject;
    flowBot.nodes.push(newNode.questionNode);
    node.complete = true;
  
    console.log(JSON.stringify(nodeArray));
    console.log(JSON.stringify(flowBot));
    modal.style.display = 'none';
    chart.draw();
}

const askQuestionHandler = (id) => {
    let node = getNode(id);
    if(node.id !== 1){
        //let isNextNodeId = (node.type === 'Response') ? node.nextNodeId : (node.type === 'Question') ? node.questionNode.nextNodeId : null;
        if(node.complete) {
            openRemoveCurrentNextNodePopup();
            return;
        }
    }
    autocomplete(searchBar, dataArray);
    parentId = id;
    searchBar.value = '';
    modal.style.display = "block";
}

const conditionHandler = (id) => {
    ++nodeId
    console.log(nodeId);
    nodeArray.push({
        id: nodeId,
        pid: id,
        name: `Condition ${nodeId}`,
        tags: ['Condition'],
        type: 'Condition',
        complete: false
    });
    chart.draw();
    console.log(JSON.stringify(nodeArray));
}

const setCondtionHandler = () => {

}

const nextVaHandler = (id, virtualAssistant) => { 
    let currentNode = getNode(id);
    let parentOfCurrentNode = getNode(currentNode.pid);
    
    if(currentNode.type === 'Response'){
        let response = getResponseNode(parentOfCurrentNode, currentNode);
        response.nextBot = virtualAssistant;
    } else if(currentNode.type === 'Question'){
        currentNode.questionNode.nextBot = virtualAssistant;
    } else {
        let obj = {
            id: currentNode.id, 
            nextNodeId: null, 
            condition: null, 
            chatEnded: false, 
            nextBot: virtualAssistant
        }
        if(parentOfCurrentNode.type === 'Question'){
            parentOfCurrentNode.questionNode.hasRules.push(obj);
        } else {
            let grandParent = getNode(parentOfCurrentNode.pid);
            let response = getResponseNode(grandParent, parentOfCurrentNode);
            response.hasRules.push(obj);
        }
        parentOfCurrentNode.complete = true;
    }
    currentNode.complete = true;
    console.log(JSON.stringify(flowBot));

    if(checkAllNodesThenSave()){
        clearAllNodesAndStartNewVA(virtualAssistant);
    }  
}

const clearAllNodesAndStartNewVA = (virtualAssistant) => {
    nodeArray.splice(0,nodeArray.length);
    nodeArray.push({ id: 1, tags: ['Start'], name: "Press the button to ask any query",type: null, questionNode: null });
    flowBot = {tenant:"emma", VA_Name: virtualAssistant, VA_Id:100, nodes: []};
    currentBotName.innerHTML = virtualAssistant;
    chart.draw();
}

var bot = [ 'Fisycal Score Victory Assessment',  'Pain Recorder Virtual Assessment',
            'Appointment Virtual Assessment', 'Lead Generator', 'Symptom',
            'Precall Test Virtual Assessment', 'Intake'
          ];

const vA_ListHandler = (id) => {
    if(offsetX + 240 > screen.width){
        offsetX -= 200;
    }
    if(offsetY + 300 > screen.height){
        offsetY -= 240;
    }
    questionOption.style.left = offsetX + 'px';
    questionOption.style.top = offsetY + 'px';

    let outerDiv = document.createElement('div');
    outerDiv.style = "overflow-y: scroll; height: 200px;";
    let innerDiv = document.createElement('div');

    for(let i = 0; i < bot.length; i++) {
        let input = document.createElement('input');

        input.style = `background-color: #882200; color: white; text-align: center;
                       font-size: 14px; border: none; 
                       border-bottom: 1px solid !important; border-radius: 0px; 
                       cursor: pointer; width: 240px;`;

        input.setAttribute('readonly', true);
        input.value = bot[i];
        input.addEventListener('click', function(){
            nextVaHandler(id,bot[i]);
        });
        let container = document.createElement('div');
        container.appendChild(input);
        innerDiv.appendChild(container);
    }
    outerDiv.appendChild(innerDiv);   
    questionOption.appendChild(outerDiv);
}

const removeSlink = (id) => {
    for(let i = 0; i < slink.length; i++){
        if(slink[i].from == id){
            slink.splice(i,1);
            i--;
        } else if(slink[i].to == id){
            let parent = getNode(slink[i].from);
            parent.complete = false;
            if(parent.type === 'Question'){
                parent.questionNode.nextNodeId = null;
            } else if(parent.type==='Response'){
                let parentOfParent = getNode(parent.pid);
                let response = getResponseNode(parentOfParent, parent);
                
                if(parentOfParent.questionNode.nextNodeId == response.nextNodeId){
                    parentOfParent.questionNode.nextNodeId = null;
                }
                response.nextNodeId = null;
            }
            slink.splice(i,1);
            i--;
        }
    }
}

const removeDataFromFlowbot = (removeFromFlowBot) => {
    while(removeFromFlowBot.length){

        let temp = removeFromFlowBot[0];
        let index = null;

        for (let i = 0; i < flowBot.nodes.length; i++){      
            if(flowBot.nodes[i].questionId === temp){
                index = i;
                for(let j = 0; j < flowBot.nodes[i].hasRules.length; j++){
                    removeFromFlowBot.push(flowBot.nodes[i].hasRules[j].nextNodeId);
                }
                if(flowBot.nodes[i].nextNodeId !== null){
                    removeFromFlowBot.push(flowBot.nodes[i].nextNodeId);
                } else {
                    let currentNodeResponses = flowBot.nodes[i].responses;
                    for(let j = 0; j < currentNodeResponses.length; j++) {
                        for(let k = 0; k < currentNodeResponses[j].hasRules.length; k++){
                            removeFromFlowBot.push(currentNodeResponses[j].hasRules[k].nextNodeId);
                        }
                        if(currentNodeResponses[j].nextNodeId !== null) {
                            removeFromFlowBot.push(currentNodeResponses[j].nextNodeId);
                        }
                    }
                }
                break;
            }
        }
        if(index !== null) {
            flowBot.nodes.splice(index,1)[0];
        }
        removeFromFlowBot.splice(0,1);
    }
}

const removeDataFromNodeArray = (removeArray) => {
    while (removeArray.length){
        id = removeArray[0];
        removeArray.splice(0,1);

        for (let i = 0; i < nodeArray.length; i++){      
            if (nodeArray[i].id === id){
                removeSlink(id);
                nodeArray.splice(i,1);
                i--;          
            } else if (nodeArray[i].pid === id) {
                removeArray.push(nodeArray[i].id);
            }
        }
    }
}

const pushIntoRemoveArrayIfResponse = (currentNode, removeFromFlowBot, parent) => {
    if(currentNode.nextNodeId !== null){
        removeFromFlowBot.push(currentNode.nextNodeId);
    }

    let parentResponses = parent.questionNode.responses;

    for(let i = 0; i < parentResponses.length; i++) {
        if(parentResponses[i].name === currentNode.name){
            parentResponses.splice(i,1);
        }
    }
}

const pushIntoRemoveArrayIfQuestion = (currentNode, removeFromFlowBot, parent) => {
    removeFromFlowBot.push(currentNode.questionNode.questionId);
    if(parent.type === 'Question'){
        parent.questionNode.nextNodeId = null;   
    } else if(parent.type === 'Response'){ 
        let parentOfParent = getNode(parent.pid);
        let response = getResponseNode(parentOfParent, parent);
        response.nextNodeId = null;
    } else if (parent.type === 'Start') {
        removeFromFlowBot.push(currentNode.questionNode.questionId);
    }else {
        let rules = [];
        let parentOfCondition = getNode(parent.pid);
        if(parentOfCondition.type === 'Question'){
            rules = parentOfCondition.questionNode.hasRules;
        } else {
            let grandParent = getNode(parentOfCondition.pid);
            let response = getResponseNode(grandParent, parentOfCondition);
            rules = response.hasRules;
        }
        removeRules(rules, parent, removeFromFlowBot);
    }
    parent.complete = false;
}

const pushIntoRemoveArrayIfCondition = (currentNode, removeFromFlowBot, parent) => {
    let rules = [];
    if(parent.type === 'Question'){
        rules = parent.questionNode.hasRules;
    } else {
        let parentOfParent = getNode(parent.pid);
        let response = getResponseNode(parentOfParent, parent);
        rules = response.hasRules;
    }
    removeRules(rules, currentNode, removeFromFlowBot);
}

const removeRules = (rules, node, removeFromFlowBot) => {
    for(let i = 0; i < rules.length; i++){
        if(rules[i].id == node.id){
            removeFromFlowBot.push(rules[i].nextNodeId);
            rules.splice(i,1);
            break;
        }
    }
}

const removeQuestionHandler = (id) => {
    let removeArray = [];
    let removeFromFlowBot = [];
    let currentNode = getNode(id);
    let parent = getNode(currentNode.pid);

    if(currentNode.type === 'Response'){
        pushIntoRemoveArrayIfResponse(currentNode, removeFromFlowBot, parent);
    } else if(currentNode.type === 'Question') {
        pushIntoRemoveArrayIfQuestion(currentNode, removeFromFlowBot, parent);
    } else {
        pushIntoRemoveArrayIfCondition(currentNode, removeFromFlowBot, parent);  
    }

    removeDataFromFlowbot(removeFromFlowBot);
    removeArray.push(id);
    removeDataFromNodeArray(removeArray);

    console.log(JSON.stringify(flowBot));
    chart.draw();
}

const deleteChildFromQuestionOptionDiv = () => {
    questionOption.innerHTML = '';
}


const checkAllResponsesCondition = (responseOfFromnodeParent) => {
    let count = 0, endCount = 0, botCount = 0;
    let arr = [], botArr = [];

    for(let i = 0; i < responseOfFromnodeParent.length; i++) {
        if(responseOfFromnodeParent[i].chatEnded === true){
            endCount++;
        }
        if(responseOfFromnodeParent[i].nextBot !== null){
            if(botArr.indexOf(responseOfFromnodeParent[i].nextBot) === -1) {
                botArr.push(responseOfFromnodeParent[i].nextBot);
            }
            botCount++;
        }
        if(responseOfFromnodeParent[i].nextNodeId !== null){
            if(arr.indexOf(responseOfFromnodeParent[i].nextNodeId) === -1) {
                arr.push(responseOfFromnodeParent[i].nextNodeId);
            }
            count++;
        }
    }
    return {
        count, endCount, botCount, arr, botArr
    }
}


const sLinkHandler = (fromnodeId, tonodeId) => {
    let fromnode = getNode(fromnodeId);
    let tonode = getNode(tonodeId);
    if(tonode.type === 'Response') return;
    if(fromnode.type === 'Condition' && tonode.type === 'Condition') return;
    let tonodeQuestionId = tonode.questionNode.questionId;

    if(fromnode.type === 'Question'){
        if(tonode.name === 'End Session'){
            fromnode.questionNode.chatEnded = true;
        } else if(tonode.type === 'virtual assistant'){
            fromnode.questionNode.nextBot = tonode.name;
        }
        fromnode.questionNode.nextNodeId = tonodeQuestionId;
    }

    if(fromnode.type === 'Response'){
        let parentOfFromnode = getNode(fromnode.pid);
        let responseOfFromnodeParent = parentOfFromnode.questionNode.responses;
        let currentResponseNode = getResponseNode(parentOfFromnode, fromnode);
        currentResponseNode.nextNodeId = tonodeQuestionId;

        if(tonode.name === 'End Session'){
            currentResponseNode.chatEnded = true;
        } else if(tonode.type === 'virtual assistant'){
            currentResponseNode.nextBot = tonode.name;
        }
        
        const {count, endCount, botCount, arr, botArr} = checkAllResponsesCondition(responseOfFromnodeParent);

        if(count === responseOfFromnodeParent.length && arr.length === 1){
            parentOfFromnode.questionNode.nextNodeId = tonodeQuestionId;
        }

        if(endCount === responseOfFromnodeParent.length){
            parentOfFromnode.questionNode.chatEnded = true;
        }

        if(botCount === responseOfFromnodeParent.length && botArr.length === 1){
            parentOfFromnode.questionNode.nextBot = tonode.name;
        }   
    }
    slink.push({from: fromnodeId, to: tonodeId});
    fromnode.complete = true;
    console.log(JSON.stringify(flowBot));
    chart.draw();
}


var mustFillCondition = [];

const checkAllNodesThenSave = () => {
    mustFillCondition = [];
    for(let i = 0; i < nodeArray.length; i++){
        if(nodeArray[i].type === 'Question'){
            let responses = nodeArray[i].questionNode.responses;
            if(!responses.length && !nodeArray[i].complete){
                mustFillCondition.push(nodeArray[i].name);
            }
        } else if(nodeArray[i].type === 'Response' && !nodeArray[i].complete){
            let parent = getNode(nodeArray[i].pid);
            if(parent.questionNode.nextNodeId === null){
                mustFillCondition.push(nodeArray[i].name);
            }  
        }  
    }

    return saveDataOrOpenDecisionMissingAlert();
}

const saveBtn = document.getElementById('save-btn');
saveBtn.addEventListener('click', () => {
    checkAllNodesThenSave();
});

const showPopup = document.getElementById('show-popup');
const popupMenu = document.getElementById('popup-menu');
const successMsg = document.getElementById('success-msg');
document.getElementById('popup-btn').addEventListener('click', () => {
    showPopup.style.display = 'none';
});

const saveDataOrOpenDecisionMissingAlert = () => {
    popupMenu.innerHTML = '';

    if(mustFillCondition.length){       
        let p = document.createElement('p');
        p.style = 'color: #000066; margin-top: 3rem;';
        let small = document.createElement('small');
        small.innerText = 'Please make decision on node ';
        let span = document.createElement('span');
        span.style.color = '#ff3333';
        span.innerText = mustFillCondition;
        p.appendChild(small);
        p.appendChild(span);
        popupMenu.appendChild(p);
        showPopup.style.display = 'block';
        return false;
    }

    axios.post(saveUrl,flowBot)
    .then(response => {
        successMsg.style.display = 'block';
        setTimeout(() => {
            successMsg.style.display = 'none';
        }, 2000);
    });
    return true;
}


var nodeElements = null;
OrgChart.events.on('redraw', function(sender) {
    nodeElements = sender.getSvg().querySelectorAll('[node-id]');

    deleteChildFromQuestionOptionDiv();

    for (var i = 0; i < nodeElements.length; i++) {
        nodeElements[i].sender = sender;
        nodeElements[i].addEventListener('mousedown', mousedownHandler);
    }
});

var offsetX;
var offsetY;

function mousedownHandler(e) {
    offsetX = e.offsetX;
    offsetY = e.offsetY;
    var sender = this.sender;

    var svg = e.target;
    while (svg.nodeName != 'svg') {
        svg = svg.parentNode;
    }

    var w = parseInt(svg.getAttribute('width'));
    var h = parseInt(svg.getAttribute('height'));
    
    var viewBox = svg.getAttribute("viewBox");
    viewBox = "[" + viewBox + "]";
    viewBox = viewBox.replace(/\ /g, ",");
    viewBox = JSON.parse(viewBox);

    var scaleX = w / viewBox[2];
    var scaleY = h / viewBox[3];

    var scale = scaleX > scaleY ? scaleY : scaleX;

    var fromnode = sender.getNode(this.getAttribute('node-id'));
    var tonode = null;


    var moveHandler = function(e) {
        if (tonode && (tonode.id != fromnode.id)) {
            var shortest = findShortestDistance(fromnode, tonode);
            line(svg, shortest.start, shortest.end);
        } else {
            var end = {
                x: (e.offsetX / scale + viewBox[0]),
                y: (e.offsetY / scale + viewBox[1])
            }         
            var shortest = findShortestDistanceBetweenPointerAndNode(fromnode, end)
            line(svg, shortest.start, shortest.end);
        }

    };

    var mouseenterHandler = function() {
        tonode = sender.getNode(this.getAttribute('node-id'));
    }

    var mouseleaveHandler = function() {
        tonode = null;
    }

    var leaveHandler = function() {
        if (tonode && (tonode.id != fromnode.id)) {
            sLinkHandler(fromnode.id, tonode.id);
        }
        removeLine();

        svg.removeEventListener('mousemove', moveHandler);
        svg.removeEventListener('mouseup', leaveHandler);
        svg.removeEventListener('mouseleave', leaveHandler);

        var nodeElements = sender.getSvg().querySelectorAll('[node-id]');
        for (var i = 0; i < nodeElements.length; i++) {
            nodeElements[i].removeEventListener('mouseenter', mouseenterHandler);
            nodeElements[i].removeEventListener('mouseleave', mouseleaveHandler);
        }
    };

    svg.addEventListener('mousemove', moveHandler);
    svg.addEventListener('mouseup', leaveHandler);
    svg.addEventListener('mouseleave', leaveHandler);

    var nodeElements = sender.getSvg().querySelectorAll('[node-id]');
    for (var i = 0; i < nodeElements.length; i++) {
        nodeElements[i].addEventListener('mouseenter', mouseenterHandler);
        nodeElements[i].addEventListener('mouseleave', mouseleaveHandler);
    }
}


function line(svg, start, end) {

    var line = document.querySelector('#bgline');
    if (!line) {
        var xmlns = "http://www.w3.org/2000/svg";
        line = document.createElementNS(xmlns, 'line');
        line.setAttributeNS(null, 'stroke-linejoin', 'round')
        line.setAttributeNS(null, 'stroke', '#aeaeae');
        line.setAttributeNS(null, 'stroke-width', '3px');
        line.setAttributeNS(null, 'id', 'bgline');
        line.setAttributeNS(null, 'marker-start', 'url(#dotSelected)');
        line.setAttributeNS(null, 'marker-end', 'url(#arrowSelected)');

        svg.appendChild(line);
    }

    line.setAttributeNS(null, 'x1', start.x);
    line.setAttributeNS(null, 'y1', start.y);
    line.setAttributeNS(null, 'x2', end.x);
    line.setAttributeNS(null, 'y2', end.y);
}


function removeLine() {
    var line = document.querySelector('#bgline');
    if (line) {
        line.parentNode.removeChild(line);
    }
}


OrgChart.events.on('renderdefs', function(sender, args) {
    args.defs += `<marker id="arrowSelected"
                    viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6"
                    markerHeight="6" orient="auto-start-reverse">
                    <path fill="blue" d="M 0 0 L 10 5 L 0 10 z" />
                  </marker>
                <marker id="dotSelected" viewBox="0 0 10 10" refX="5" refY="5"
                    markerWidth="5" markerHeight="5"> 
                    <circle cx="5" cy="5" r="5" fill="blue" />
                </marker>`;
});


function findShortestDistance(fromNode, toNode) {
    var fromNodepoints = [];
    fromNodepoints.push({
        x: fromNode.x + fromNode.w / 2,
        y: fromNode.y
    });
    fromNodepoints.push({
        x: fromNode.x + fromNode.w,
        y: fromNode.y + fromNode.h / 2
    });
    fromNodepoints.push({
        x: fromNode.x + fromNode.w / 2,
        y: fromNode.y + fromNode.h
    });
    fromNodepoints.push({
        x: fromNode.x,
        y: fromNode.y + fromNode.h / 2
    });

    var toNodepoints = [];
    toNodepoints.push({
        x: toNode.x + toNode.w / 2,
        y: toNode.y
    });
    toNodepoints.push({
        x: toNode.x + toNode.w,
        y: toNode.y + toNode.h / 2
    });
    toNodepoints.push({
        x: toNode.x + toNode.w / 2,
        y: toNode.y + toNode.h
    });
    toNodepoints.push({
        x: toNode.x,
        y: toNode.y + toNode.h / 2
    });

    var dist = null;
    var distPoint = {};
    for (var i = 0; i < fromNodepoints.length; i++) {
        for (var j = 0; j < toNodepoints.length; j++) {
            var cur = Math.sqrt((toNodepoints[j].x - fromNodepoints[i].x)
                                * (toNodepoints[j].x - fromNodepoints[i].x) 
                                +(toNodepoints[j].y - fromNodepoints[i].y) 
                                *(toNodepoints[j].y - fromNodepoints[i].y));
            if (dist == null) {
                dist = cur;
                distPoint = {
                    i: i,
                    j: j
                };
            } else if (cur < dist) {
                distPoint = {
                    i: i,
                    j: j
                };
                dist = cur;
            }
        }
    }

    return {
        start: fromNodepoints[distPoint.i],
        end: toNodepoints[distPoint.j]
    }
}


function findShortestDistanceBetweenPointerAndNode(fromNode, p) {
    var fromNodepoints = [];
    fromNodepoints.push({
        x: fromNode.x + fromNode.w / 2,
        y: fromNode.y
    });
    fromNodepoints.push({
        x: fromNode.x + fromNode.w,
        y: fromNode.y + fromNode.h / 2
    });
    fromNodepoints.push({
        x: fromNode.x + fromNode.w / 2,
        y: fromNode.y + fromNode.h
    });
    fromNodepoints.push({
        x: fromNode.x,
        y: fromNode.y + fromNode.h / 2
    });


    var dist = null;
    var distPoint = null;
    for (var i = 0; i < fromNodepoints.length; i++) {
        var cur = Math.sqrt((p.x - fromNodepoints[i].x) 
                            *(p.x - fromNodepoints[i].x)
                            + (p.y - fromNodepoints[i].y) 
                            * (p.y - fromNodepoints[i].y));
        if (dist == null) {
            dist = cur;
            distPoint = i;
        } else if (cur < dist) {
            distPoint = i;
            dist = cur;
        }
    }

    return {
        start: fromNodepoints[distPoint],
        end: p
    };
}


const tree = document.getElementById("tree");
tree.style.display = 'none';
saveBtn.style.display = 'none';
let v_a = '';

let selectVa = document.getElementById('select-va');
for(item in bot){
    let div = document.createElement('div');
    let button = document.createElement('button');
    button.classList.add('va-button');
    button.innerHTML = bot[item];
    button.addEventListener('click', (e) => {
        setVirtualAssistant(button.innerHTML);
    });
    div.appendChild(button);
    selectVa.appendChild(div);
}

var chart = null;
var currentBotName = document.getElementById('current-bot');

const setVirtualAssistant = (text) => {
    console.log(text);
    flowBot.VA_Name = text;
    currentBotName.innerHTML = text;
    console.log(flowBot);  
    openOrgChart();
}

var nodes = nodeArray;

OrgChart.templates.belinda.node = '<circle cx="90" cy="80" r="80" fill="#055625"></circle>';
OrgChart.templates.belinda.nodeMenuButton = '<g style="cursor:pointer;" control-node-menu-id="{id}">'
                                        +'<rect x="70" y="120"  fill="#FEA139" style="width: 40px; height: 20px;" rx="10" ry="10" ></rect>'
                                        +'<text width="230" style="font-size: 25px; cursor: pointer;" fill="#ffffff" x="90" y="139" text-anchor="middle" class="field_0">+</text></g>';
OrgChart.templates.belinda.field_0 = `<text 
                                        width="230" style="font-size: 20px;" fill="#ffffff" 
                                        x="90" y="75" text-anchor="middle" class="field_0">
                                        {val}
                                    </text>`;

OrgChart.templates.mery.link = `<path
                                    stroke-linejoin="round"' stroke="#aeaeae"' 
                                    stroke-width="1px" fill="none" d="{edge}"'
                                />`;
OrgChart.templates.mery.node = `<rect
                                    stroke="#aeaeae" stroke-width="1px" x="15" y="0"  
                                    fill="#FE5639" style="width: 220px; height: 100px;">
                                </rect>`;
OrgChart.templates.mery.field_0 = `<text 
                                        width="230" style="font-size: 20px;" fill="#ffffff" 
                                        x="125" y="50" text-anchor="middle" class="field_0">
                                        START
                                    </text>`;
OrgChart.templates.mery.nodeMenuButton = '<g style="cursor:pointer;" control-node-menu-id="{id}">'
                                        +'<rect x="190" y="75"  fill="#FEA139" style="width: 40px; height: 20px;" rx="10" ry="10" ></rect>'
                                        +'<text width="230" style="font-size: 25px; cursor: pointer;" fill="#ffffff" x="210" y="94" text-anchor="middle" class="field_0">+</text></g>';

OrgChart.templates.ana.link = '<path stroke-linejoin="round" stroke="#aeaeae" stroke-width="1px" fill="none" d="{edge}" />';
OrgChart.templates.ana.node = '<rect stroke="#aeaeae" stroke-width="1px" x="30" y="0"  fill="#A1EAB3" style="width: 200px; height: 90px;" rx="30" ry="30" ></rect>';
OrgChart.templates.ana.field_0 = '<text width="230" style="font-size: 14px;" fill="#000000" x="125" y="40" text-anchor="middle" class="field_0">{val}</text>';
OrgChart.templates.ana.nodeMenuButton = '<g style="cursor:pointer;" control-node-menu-id="{id}">'
                                        +'<rect x="175" y="65"  fill="#A5AD03" style="width: 40px; height: 20px;" rx="10" ry="10" ></rect>'
                                        +'<text width="230" style="font-size: 25px; cursor: pointer;" fill="#ffffff" x="195" y="84" text-anchor="middle" class="field_0">+</text></g>';

OrgChart.templates.ula.node = '<rect stroke="#aeaeae" stroke-width="1px" x="15" y="0"  fill="#D89E3E" style="width: 220px; height: 100px;" ></rect>';
OrgChart.templates.ula.field_0 = '<text width="230" style="font-size: 14px;" fill="#000000" x="125" y="40" text-anchor="middle" class="field_0">{val}</text>';
OrgChart.templates.ula.nodeMenuButton = '<g style="cursor:pointer;" control-node-menu-id="{id}">'
                                        +'<rect x="190" y="75"  fill="#D8553E" style="width: 40px; height: 20px;" rx="10" ry="10" ></rect>'
                                        +'<text width="230" style="font-size: 25px; cursor: pointer;" fill="#ffffff" x="210" y="94" text-anchor="middle" class="field_0">+</text></g>';

OrgChart.templates.isla.node = '<rect stroke="#aeaeae" stroke-width="1px" x="-20" y="0"  fill="#2B2727" style="width: 220px; height: 100px;" ></rect>';
OrgChart.templates.isla.field_0 = '<text width="230" style="font-size: 20px;" fill="#ffffff" x="90" y="52" text-anchor="middle" class="field_0">{val}</text>';
OrgChart.templates.isla.nodeMenuButton = '<g style="cursor:pointer;" control-node-menu-id="{id}"></g>';

const openOrgChart = () => {
    saveBtn.style.display = 'block';
    selectVa.style.display = 'none';
    tree.style.display = 'block';
    chart = new OrgChart( tree, {
        enableSearch: false,
        template: "ula",
        tags: {
            Start: {
                template: "mery",
                nodeMenu: {
                    askQuestion: {
                        icon: "",
                        text: "Add Question",
                        onClick: askQuestionHandler
                    }
                }
            },
            Response: {
                template: "ana"
            },
            Question: {
                template: "ula"
            },
            Condition: {
                template: "belinda",
                nodeMenu: {
                    setCondition: {
                        icon: "",
                        text: "Set Condition",
                        onClick: setCondtionHandler
                    },
                    noCondition: {
                        icon: "",
                        text: "Add Question",
                        onClick: askQuestionHandler
                    },
                    
                    goToAnotherVA: {
                        icon: "",
                        text: "Go to another V/A",
                        onClick: vA_ListHandler
                    },
                    remove: {
                        icon: "",
                        text: "Remove Question",
                        onClick: removeQuestionHandler
                    },
                    endsession: {
                        icon: "",
                        text: "End Session",
                        onClick: endSessionHandler
                    }
                }
            },
            End: {
                template: "isla"
            }
        },
    
        nodeMenu: {
            askQuestion: {
                icon: "",
                text: "Add Question",
                onClick: askQuestionHandler
            },

            addCondition: {
                icon: "",
                text: "Add Condition",
                onClick: conditionHandler
            },
    
            goToAnotherVA: {
                icon: "",
                text: "Go to another V/A",
                onClick: vA_ListHandler
            },
    
            remove: {
                icon: "",
                text: "Remove Question",
                onClick: removeQuestionHandler
            },
    
            endsession: {
                icon: "",
                text: "End Session",
                onClick: endSessionHandler
            }
        },
        nodeBinding: {
            field_0: "name"
        },
        slinks: slink,
        nodes: nodes
    });

    chart.on('click', (a, b) => {
        deleteChildFromQuestionOptionDiv();
        return false;
    });
}

var shape = JSON.parse(localStorage.getItem('shape'));
if(shape){
    //saveUrl = 'http://localhost:5000/update/'+shape.id;
    
    flowBot.VA_Name = shape.VA_Name;
    flowBot.VA_Id = shape.VA_Id;
    flowBot.tenant = shape.tenant;
    flowBot.nodes = JSON.parse(shape.nodes);
    nodeArray = JSON.parse(shape.shape);
    slink = JSON.parse(shape.slink);
    nodes = nodeArray;
    console.log(nodeArray);
    console.log(flowBot);
    currentBotName.innerHTML = flowBot.VA_Name;
    openOrgChart();
    
}