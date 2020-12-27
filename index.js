//each response nodes of a question
//are getting this parentId as their
// parent node id
var parentId = null;
var flowBot = {tenant: 'ema',nodes: []};
var nodeArray = [{ id: 1, name: "Press the button to ask any query", questionNode: null }];
var questionArray = null;

//fetching data from the server and set it to the questionArray
axios.get( './data.json' ).then( data =>{ 
    questionArray = data.data.data;
    let str = [];
    for (let i = 0; i < questionArray.questions.length; i++){
        let m = str.indexOf(questionArray.questions[i].responseType);
        if(m === -1) str.push(questionArray.questions[i].responseType);
    }
    console.log(str);
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


const addConditionHandler = (id) => {
    console.log(`add condition handler ${id}`);
}


const endSessionHandler = (id) => {

    let endNode = nodeArray.filter(result => result.id === id);
    let parentOfEndNode = nodeArray.filter(result => result.id === endNode[0].pid);
    parentOfEndNode[0].questionNode.chatEnded = true;

    if(parentOfEndNode[0].questionNode.responses !== null){
        let responseOfParent = parentOfEndNode[0].questionNode.responses.filter(res => res.name === endNode[0].name);
        responseOfParent[0].chatEnded = true;
    }
    console.log(JSON.stringify(flowBot));

    nodeArray.push({id: 0, pid: id, name: 'End Session'});
    
    chart.draw();
}

// response handling after select a question
var questionNodeObject = null;
function questionHandler(questionObject) { 

    questionObject.responses.sort((a,b) => {return a.viewOrder - b.viewOrder});
    let currentNode = nodeArray.filter((res) => res.id === parentId);
    currentNode[0].questionName = questionObject.text;
  
    if(nodeArray.length > 1){
        let parentNode = nodeArray.filter(res => res.id === currentNode[0].pid);
        if(parentNode[0].questionNode.responses === null){
            parentNode[0].questionNode.nextNodeId = questionObject.questionId;
        } else {
            let child = parentNode[0].questionNode.responses.filter(result => result.name === currentNode[0].name);
            child[0].nextNodeId = questionObject.questionId;
        }
    }

    console.log(questionObject.responses);
    if(questionObject.responses.length === 0){
        console.log(questionObject.responses);
        nodeArray.push({
            id: nodeArray.length + 1,
            pid: parentId,
            name: questionObject.text,
            questionNode: null
        });
    }

    var responseArray = [];
    // pushing all response node into question tree if any response node is there
    for(let i = 0; i < questionObject.responses.length; i++){
        nodeArray.push({
            id: nodeArray.length + 1,
            pid: parentId,
            name: questionObject.responses[i].name,
            questionNode: null
        });
        responseArray.push({
            responseId: responseArray.length,
            name: questionObject.responses[i].name,
            nextNodeId: null,
            chatEnded: false
        });
    }

    questionNodeObject = {
        questionId: questionObject.questionId,
        NodeType: questionObject.typeName,
        question: questionObject.text,
        nextNodeId: null,
        chatEnded: false,
        responses: null
    }

    if(responseArray.length){
        questionNodeObject.responses = responseArray;
    }

    currentNode[0].questionNode = questionNodeObject;
    flowBot.nodes.push(currentNode[0].questionNode);
  
    console.log(JSON.stringify(flowBot));
    modal.style.display = 'none';        //close modal
    chart.draw();
}


//when asking question there will open a modal
//input box should be clean
//current node id will be set to the parentId
const askQuestionHandler = (id) => {
    autocomplete(searchBar, questionArray.questions);
    parentId = id;
    searchBar.value = '';
    modal.style.display = "block";
}

const questionTypeHandler = (id, type) => {
    console.log(id, type);
}


const vA_Handler = (id) => {
     
    if(offsetX + 200 > screen.width){
        offsetX -= 200;
    }
    if(offsetY + 200 > screen.height){
        offsetY -= 100;
    }
    questionOption.style.left = offsetX + 'px';
    questionOption.style.top = offsetY + 'px';
    
    let div = `
        <div>
            <div><input style="background-color: #882200; color: white; text-align: center; border: none; border-bottom: 1px solid !important; border-radius: 0px; cursor: pointer; width: 200px;" type="text" readonly onclick="questionTypeHandler(${id}, 'Question')" value="Question"/></div>
            <div><input style="background-color: #882200; color: white; text-align: center; border: none; border-bottom: 1px solid !important; border-radius: 0px; cursor: pointer; width: 200px;" type="text" readonly onclick="questionTypeHandler(${id}, 'Condition')" value="Condition"/></div>
            <div><input style="background-color: #882200; color: white; text-align: center; border: none; border-bottom: 1px solid !important; border-radius: 0px; cursor: pointer; width: 200px;" type="text" readonly onclick="questionTypeHandler(${id}, 'End')" value="End"/></div>
        </div>
    `
    questionOption.innerHTML = div;
}


//making a queue of subtree for delete
//it is like push and pop a queue concept
const removeQuestionHandler = (id) => {
    let removeArray = [];
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
            } else if (nodeArray[i].pid === id){
                removeArray.push(nodeArray[i].id);
            }
        }
    }
    chart.draw();
}

const deleteChildFromQuestionOptionDiv = () => {
    questionOption.innerHTML = '';
}

var nodeElements = null;
OrgChart.events.on('redraw', function(sender) {
    nodeElements = sender.getSvg().querySelectorAll('[node-id]');

    deleteChildFromQuestionOptionDiv();

    for (var i = 0; i < nodeElements.length; i++) {
        let t = nodeElements[0].ownerSVGElement;
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
            //line(svg, tonode.middle, fromnode.middle);
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
        line.setAttributeNS(null, 'stroke-width', '1px');
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
    args.defs += '<marker id="arrowSelected" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path fill="blue" d="M 0 0 L 10 5 L 0 10 z" /></marker><marker id="dotSelected" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5"> <circle cx="5" cy="5" r="5" fill="blue" /></marker>';
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
            var cur = Math.sqrt((toNodepoints[j].x - fromNodepoints[i].x) * (toNodepoints[j].x - fromNodepoints[i].x) + (toNodepoints[j].y - fromNodepoints[i].y) * (toNodepoints[j].y - fromNodepoints[i].y));
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
        var cur = Math.sqrt((p.x - fromNodepoints[i].x) * (p.x - fromNodepoints[i].x) + (p.y - fromNodepoints[i].y) * (p.y - fromNodepoints[i].y));
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

//customization in design of node field and menu button 
OrgChart.templates.ula.field_0 = '<text width="230" style="font-size: 12px;" fill="#000000" x="125" y="40" text-anchor="middle" class="field_0">{val}</text>';
OrgChart.templates.ula.field_1 = '<text width="230" style="font-size: 10px;" fill="#000000" x="125" y="60" text-anchor="middle" class="field_0">{val}</text>';
OrgChart.templates.ula.nodeMenuButton = '<g style="cursor:pointer;" control-node-menu-id="{id}">'
                                        +'<rect x="205" y="75"  fill="#0099ff" style="width: 40px; height: 20px;" rx="10" ry="10" ></rect>'
                                        +'<text width="230" style="font-size: 10px; cursor: pointer;" fill="#ffffff" x="225" y="88" text-anchor="middle" class="field_0">Query</text></g>';
//OrgChart implementation
var chart = new OrgChart(document.getElementById("tree"), {
    mouseScrool: OrgChart.action.scroll,
    template: "ula",

    nodeMenu: {
        askQuestion: {
            icon: "",
            text: "Ask Question",
            onClick: askQuestionHandler
        },

        // condition: {
        //     icon: "",
        //     text: "Add Condition",
        //     onClick: addConditionHandler
        // },

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
        field_0: "name",
        field_1: "questionName"
    },

    nodes: nodes
});

//nothing will happen on chart node click
chart.on('click', (a, b) => {
    deleteChildFromQuestionOptionDiv();
    return false;
});