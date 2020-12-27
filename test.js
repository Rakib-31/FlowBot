export function hello(){//each response nodes of a question
//are getting this parentId as their
// parent node id
var parentId = null;
var flowBot = {tenant: 'ema',nodes: []};
var nodeArray = [{ id: 1, name: "Press the button to ask any query" }];
var questionArray = null;
var xx = 'js';
//fetching data from the server and set it to the questionArray
axios.get( './data.json' ).then( data => questionArray = data.data.data );


var searchBar = document.getElementById('search-bar'); // select search bar from the dom
var modal = document.getElementById("myModal");        // select modal from dom


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
    if(prevNode !== null){
        prevNode.chatEnded = true;
    }
    console.log(JSON.stringify(flowBot));
    nodeArray.push({ id: 0, pid: id, name: 'End Session' });
    chart.draw();
}


// response handling after select a question
var prevNode = null;

function questionHandler(questionObject) {
    let currentNode = nodeArray.filter((res) => res.id === parentId);   // set current node as parent node for the selected question's response node
    if(prevNode !== null){
        let temp = prevNode.responses.filter(res => res.name === currentNode[0].name);
        console.log(temp);
        temp[0].nextQuestionId = questionObject.questionId;
    }
    
    currentNode[0].questionName = questionObject.text;
    questionObject.responses.sort((a,b) => {return a.viewOrder - b.viewOrder}); // sort response for view by order in the question tree
    
    var responseArray = [];
    // pushing all response node into question tree
    for(let i = 0; i < questionObject.responses.length; i++){
        nodeArray.push({
            id: nodeArray.length + 1,
            pid: parentId,
            name: questionObject.responses[i].name
        });
        responseArray.push({
            responseId: responseArray.length,
            name: questionObject.responses[i].name,
            nextQuestionId: null
        });
    }

    //set the current node as previous node
    prevNode = {
        questionId: questionObject.questionId,
        NodeType: questionObject.typeName,
        question: questionObject.text,
        nextQuestionId: null,
        chatEnded: false,
        responses: responseArray
    }
    //push the current node into flowBot
    flowBot.nodes.push(prevNode);  
    console.log(JSON.stringify(flowBot));
    modal.style.display = 'none';        //close modal
    console.log(nodeArray);
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
}
