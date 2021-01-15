//each response nodes of a question
//are getting this parentId as their
// parent node id
//const env = process.env;

var parentId = null;
var flowBot = {tenant:"emma", VA_Name:"MSK_BOT", VA_Id:100, nodes: []};
var nodeArray = [{ id: 1, tags: ['Start'], name: "Press the button to ask any query",type: null, questionNode: null }];
var questionArray = null;

//fetching data from the server and set it to the questionArray
axios.get( './data.json' ).then( data =>{ 
    questionArray = data.data.data;
});


var searchBar = document.getElementById('search-bar'); // select search bar from the dom
var modal = document.getElementById("myModal");        // select modal from dom
let questionOption = document.getElementById('question-option');


var span = document.getElementsByClassName("close")[0];  //select cross button from modal
span.onclick = function() {                             //click cross button to close the modal
    modal.style.display = "none";
}


function autocomplete(inp, dataArray) {                // auto complete input field section from line 27 to 101
    var currentFocus;
    inp.addEventListener("input", function(e) {
        var val = this.value;
        closeAllLists();                              //close any already open lists of autocompleted values
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

                itemDiv.addEventListener('click', function() {
                    questionHandler(dataArray[i]);
                }, false);
                itemContainerDiv.appendChild(itemDiv);
            }
        }
    });

    
    inp.addEventListener("keydown", function(e) {                          //execute a function presses a key on the keyboard
        var x = document.getElementById(this.id + "autocomplete-list");
        if (x) x = x.getElementsByTagName("div");
        if (e.keyCode == 40) {      
            currentFocus++;                                                //If the arrow DOWN key is pressed increase the currentFocus variable:
            addActive(x);                                                  //and and make the current item more visible
        } else if (e.keyCode == 38) {   
            currentFocus--;                                                //If the arrow UP key is pressed decrease the currentFocus variable
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
        removeActive(x);                                                  //start by removing the "active" class on all items
        if (currentFocus >= x.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = (x.length - 1);
        x[currentFocus].classList.add("autocomplete-active");             //active the selected item div
    }

    //function for removing item from the active list on autocomplete
    function removeActive(x) {
        for (var i = 0; i < x.length; i++) {
            x[i].classList.remove("autocomplete-active");
        }
    }

    //close all list of item in the item container div
    function closeAllLists(elmnt) {
        var x = document.getElementsByClassName("autocomplete-items");
        for (var i = 0; i < x.length; i++) {
            if (elmnt != x[i] && elmnt != inp) {
                x[i].parentNode.removeChild(x[i]);
            }
        }
    }
    //execute a function when someone clicks in the document
    document.addEventListener("click", function(e) {
        closeAllLists(e.target);
    });
}


// end node controller
const endSessionHandler = (id) => {
    let endNode = getNode(id);

    if(endNode.type === 'Condition'){
        let endParentNode = getNode(endNode.pid);
        let responseNode = getResponseNode(endParentNode, endNode);
        responseNode.chatEnded = true;

    } else if (endNode.type === 'Question') {
        endNode.questionNode.chatEnded = true;
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


// response handling after select a question
var questionNodeObject = null;

function questionHandler(questionObject) { 

    let newNode = {                    //should be pushed in selected node in nodearray and flowbot also.
        id: nodeArray.length + 1,
        pid: parentId,
        tags: ['Question'],
        name: questionObject.text,
        type: 'Question',
        questionNode: null,
        complete: false,
        right: 0
    }

    let node = getNode(parentId);
    nodeArray.push(newNode);
    if(node.type === 'Condition'){
        let anotherNode = getNode(node.pid);   
        let responseNode = getResponseNode(anotherNode, node);
        responseNode.nextNodeId = questionObject.questionId;
        node.nextNodeId = questionObject.questionId;
        
    }

    if(node.type === 'Question'){
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
    
    questionObject.responses.sort((a,b) => {return a.viewOrder - b.viewOrder}); //sort for the purpose of view order

    var responseArray = [];
    // pushing all response node into question tree if any response node is there
    for(let i = 0; i < questionObject.responses.length; i++){
        nodeArray.push({
            id: nodeArray.length + 1,
            pid: newNode.id,
            parentQid: questionObject.questionId,
            tags: ['Condition'],
            name: questionObject.responses[i].name,
            type: 'Condition',
            nextNodeId: null,
            complete: false
        });
        responseArray.push({                         //flowbot node's responses
            nodeType: 'Condition',
            responseId: responseArray.length,
            name: questionObject.responses[i].name,
            nextNodeId: null,
            nextBot: null,
            chatEnded: false
            //slink: null
        });
    }

    //this should be same for specific node and its corresponding element in flowbot
    //so that when one chande its nature another can be change automatically
    questionNodeObject = {
        questionId: questionObject.questionId,
        questionType: questionObject.typeName,
        question: questionObject.text,
        NodeType: 'Question',
        nextNodeId: null,
        nextBot: null,
        chatEnded: false,
        //slink: null,
        responseType: questionObject.responseType,
        responses: []
    }

    if(responseArray.length){
        questionNodeObject.responses = responseArray;
    }

    newNode.questionNode = questionNodeObject;

    //nodeArray.push(newNode);

    flowBot.nodes.push(newNode.questionNode);
    node.complete = true;
  
    console.log(JSON.stringify(nodeArray));
    console.log(JSON.stringify(flowBot));
    modal.style.display = 'none';        //close modal
    chart.draw();
}


//when asking question there will open a modal
//input box should be clean
//current node id will be set to the parentId
const askQuestionHandler = (id) => {
    let node = getNode(id);
    
    if(node.type === 'Condition'){
        if(node.nextNodeId !== null){
            openRemoveCurrentNextNodePopup();
            return;
        }
    }

    if(node.type === 'Question'){
        if(node.questionNode.nextNodeId !== null){
            openRemoveCurrentNextNodePopup();
            return;
        }
    }
    autocomplete(searchBar, questionArray.questions);
    parentId = id;
    searchBar.value = '';
    modal.style.display = "block";
}

const vaTypeHandler = (pId, virtualAssistant) => { 
    nodeArray.push({
        id: nodeArray.length+1, 
        pid: pId, name: virtualAssistant, 
        type: 'virtual assistant', 
        questionNode: {questionId: null}
    });
    let parent = getNode(pId);

    if(parent.type === 'Condition'){
        let parentOfParent = getNode(parent.pid);
        let response = getResponseNode(parentOfParent, parent);
        response.nextBot = virtualAssistant;
    } else if(parent.type === 'Question'){
        parent.questionNode.nextBot = virtualAssistant;
    }
    parent.complete = true;
    chart.draw();
    console.log(JSON.stringify(flowBot));
}


const vA_Handler = (id) => {
    // out of box on x axis
    if(offsetX + 240 > screen.width){
        offsetX -= 200;
    }
    // out of box on y axis
    if(offsetY + 300 > screen.height){
        offsetY -= 240;
    }
    questionOption.style.left = offsetX + 'px';
    questionOption.style.top = offsetY + 'px';

    let bot = ['Fisycal Score Victory Assessment',  'Pain Recorder Virtual Assessment',
                'Appointment Virtual Assessment', 'Lead Generator', 'Symptom',
                'Precall Test Virtual Assessment', 'Intake'
              ];

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
            vaTypeHandler(id,bot[i]);
        });
        let container = document.createElement('div');
        container.appendChild(input);
        innerDiv.appendChild(container);
    }
    outerDiv.appendChild(innerDiv);   
    questionOption.appendChild(outerDiv);
}


const nullAllParentsNextId = (questionId) => {

}

//making a queue of subtree for delete
//it is like push and pop a queue concept
const removeQuestionHandler = (id) => {

    let removeArray = [];
    let removeFromFlowBot = [];
    let currentNode = getNode(id);
    let parent = getNode(currentNode.pid);
    //remove from flowbot
    if(currentNode.type === 'Condition'){
        if(currentNode.nextNodeId !== null){
            removeFromFlowBot.push(currentNode.nextNodeId);
        }

        let parentResponses = parent.questionNode.responses;

        for(let i = 0; i < parentResponses.length; i++) {
            if(parentResponses[i].name === currentNode.name){
                parentResponses.splice(i,1);
            }
        }
    } else if(currentNode.type === 'Question') {
        removeFromFlowBot.push(currentNode.questionNode.questionId);
        if(parent.type === 'Question'){
            parent.questionNode.nextNodeId = null;
        } else if(parent.type === 'Condition'){
            let parentOfParent = getNode(parent.pid);
            let response = getResponseNode(parentOfParent, parent);
            response.nextNodeId = null;
        }
    }

    while(removeFromFlowBot.length){

        let temp = removeFromFlowBot[0];
        let index = null;

        for (let i = 0; i < flowBot.nodes.length; i++){      
            if(flowBot.nodes[i].questionId === temp){
                index = i;
                if(flowBot.nodes[i].nextNodeId !== null){
                    removeFromFlowBot.push(flowBot.nodes[i].nextNodeId);
                } else {
                    let currentNodeResponses = flowBot.nodes[i].responses;
                    for(let j = 0; j < currentNodeResponses.length; j++) {
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
            //flowBot.nodes[index].questionId = null;
            //let deletedNode = flowBot.nodes.splice(index,1)[0];
            //console.log(deletedNode);
            //nullAllParentsNextId(deletedNode.questionId);
        }
        removeFromFlowBot.splice(0,1);
    }

    //remove from nodearray
    removeArray.push(id);
    
    // remove the subtree which root id is id in the tree
    while (removeArray.length){
        id = removeArray[0];
        removeArray.splice(0,1);
        // remove the current node and push all child of this current node in the removeArray
        for (let i = 0; i < nodeArray.length; i++){      
            if (nodeArray[i].id === id){
                nodeArray.splice(i,1);
                i--;          
            } else if (nodeArray[i].pid === id) {
                removeArray.push(nodeArray[i].id);
            }
        }
    }
    console.log(JSON.stringify(nodeArray));
    console.log(JSON.stringify(flowBot));
    chart.draw();
}

const deleteChildFromQuestionOptionDiv = () => {
    questionOption.innerHTML = '';
}


//handling dragging link
const sLinkHandler = (fromnodeId, tonodeId) => {

    let count = 0, endCount = 0, botCount = 0;
    let arr = [], botArr = [];
    let fromnode = getNode(fromnodeId);
    let tonode = getNode(tonodeId);
    console.log(tonode);
    let tonodeQuestionId = tonode.questionNode.questionId;
    console.log(tonodeQuestionId);

    if(fromnode.type === 'Question'){
        if(tonode.name === 'End Session'){
            fromnode.questionNode.chatEnded = true;
        } else if(tonode.type === 'virtual assistant'){
            fromnode.questionNode.nextBot = tonode.name;
        }
        fromnode.questionNode.nextNodeId = tonodeQuestionId;
    }

    if(fromnode.type === 'Condition'){
        let parentOfFromnode = getNode(fromnode.pid);
        let responseOfFromnodeParent = parentOfFromnode.questionNode.responses;
        let currentResponseNode = getResponseNode(parentOfFromnode, fromnode);
        currentResponseNode.nextNodeId = tonodeQuestionId;
        console.log(currentResponseNode);

        if(tonode.name === 'End Session'){
            currentResponseNode.chatEnded = true;
        } else if(tonode.type === 'virtual assistant'){
            console.log(currentResponseNode);
            currentResponseNode.nextBot = tonode.name;
        }
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
    fromnode.complete = true;
    console.log(JSON.stringify(flowBot));
}


var mustFeelCondition = [];
const saveBtn = document.getElementById('save-btn');
saveBtn.addEventListener('click', () => {
    mustFeelCondition = [];
    for(let i = 0; i < nodeArray.length; i++){
        if(nodeArray[i].type === 'Question'){
            let responses = nodeArray[i].questionNode.responses;
            if(!responses.length && !nodeArray[i].complete){
                mustFeelCondition.push(nodeArray[i].name);
            }
        } else if(nodeArray[i].type === 'Condition' && !nodeArray[i].complete){
            let parent = getNode(nodeArray[i].pid);
            if(parent.questionNode.nextNodeId === null){
                mustFeelCondition.push(nodeArray[i].name);
            }  
        }  
    }

    openPopupAfterSave();
    console.log(mustFeelCondition);
});

const showPopup = document.getElementById('show-popup');
const popupMenu = document.getElementById('popup-menu');
const successMsg = document.getElementById('success-msg');
document.getElementById('popup-btn').addEventListener('click', () => {
    showPopup.style.display = 'none';
});

const openPopupAfterSave = () => {
    popupMenu.innerHTML = '';

    if(mustFeelCondition.length){       
        let p = document.createElement('p');
        p.style = 'color: #000066; margin-top: 3rem;';
        let small = document.createElement('small');
        small.innerText = 'Please make decision on node ';
        let span = document.createElement('span');
        span.style.color = '#ff3333';
        span.innerText = mustFeelCondition;
        p.appendChild(small);
        p.appendChild(span);
        popupMenu.appendChild(p);
        showPopup.style.display = 'block';
        return;
    }
    axios.post('http://localhost:5000/post?VA_Name=' + flowBot.VA_Name, flowBot)
    .then(response => {
        console.log(response);
        successMsg.style.display = 'block';
        setTimeout(() => {
            successMsg.style.display = 'none';
        }, 2000);
    }); 
}


//call every time when needs chart redraw 
var nodeElements = null;
OrgChart.events.on('redraw', function(sender) {
    nodeElements = sender.getSvg().querySelectorAll('[node-id]');

    deleteChildFromQuestionOptionDiv();

    for (var i = 0; i < nodeElements.length; i++) {
        nodeElements[i].sender = sender;
        nodeElements[i].addEventListener('mousedown', mousedownHandler);
    }
});

// For nodeType option x,y coordinate
//position setup on the svg
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
            sender.addSlink(fromnode.id, tonode.id).draw();
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


var nodes = nodeArray;

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

//customization in design of node field and menu button 
OrgChart.templates.ula.node = '<rect stroke="#aeaeae" stroke-width="1px" x="15" y="0"  fill="#D89E3E" style="width: 220px; height: 100px;" ></rect>';
OrgChart.templates.ula.field_0 = '<text width="230" style="font-size: 14px;" fill="#000000" x="125" y="40" text-anchor="middle" class="field_0">{val}</text>';
OrgChart.templates.ula.nodeMenuButton = '<g style="cursor:pointer;" control-node-menu-id="{id}">'
                                        +'<rect x="190" y="75"  fill="#D8553E" style="width: 40px; height: 20px;" rx="10" ry="10" ></rect>'
                                        +'<text width="230" style="font-size: 25px; cursor: pointer;" fill="#ffffff" x="210" y="94" text-anchor="middle" class="field_0">+</text></g>';

OrgChart.templates.isla.node = '<rect stroke="#aeaeae" stroke-width="1px" x="-20" y="0"  fill="#2B2727" style="width: 220px; height: 100px;" ></rect>';
OrgChart.templates.isla.field_0 = '<text width="230" style="font-size: 20px;" fill="#ffffff" x="90" y="52" text-anchor="middle" class="field_0">{val}</text>';
OrgChart.templates.isla.nodeMenuButton = '<g style="cursor:pointer;" control-node-menu-id="{id}"></g>';

//OrgChart implementation
var chart = new OrgChart(document.getElementById("tree"), {
    
    template: "ula",
    tags: {
        Start: {
            template: "mery",
            nodeMenu: {
                askQuestion: {
                    icon: "",
                    text: "Ask Question",
                    onClick: askQuestionHandler
                },
        
                goToAnotherVA: {
                    icon: "",
                    text: "Go to another V/A",
                    onClick: vA_Handler
                },
        
                endsession: {
                    icon: "",
                    text: "End Session",
                    onClick: endSessionHandler
                }
            }
        },
        Condition: {
            template: "ana"
        },
        Question: {
            template: "ula"
        },
        End: {
            template: "isla"
        }
    },

    nodeMenu: {
        askQuestion: {
            icon: "",
            text: "Ask Question",
            onClick: askQuestionHandler
        },

        goToAnotherVA: {
            icon: "",
            text: "Go to another V/A",
            onClick: vA_Handler
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

    nodes: nodes
});

//nothing will happen on chart node click
chart.on('click', (a, b) => {
    deleteChildFromQuestionOptionDiv();
    return false;
});