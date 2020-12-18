OrgChart.events.on('redraw', function(sender) {
    var nodeElements = sender.getSvg().querySelectorAll('[node-id]');
    for (var i = 0; i < nodeElements.length; i++) {
        nodeElements[i].sender = sender;
        nodeElements[i].addEventListener('mousedown', mousedownHandler);
    }
});

function mousedownHandler(e) {
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
    console.log(viewBox);
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
            sender.addSlink(fromnode.id, tonode.id, "", '').draw();
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

function findShortestDistance(n1, n2) {
    var n1points = [];
    n1points.push({
        x: n1.x + n1.w / 2,
        y: n1.y
    });
    n1points.push({
        x: n1.x + n1.w,
        y: n1.y + n1.h / 2
    });
    n1points.push({
        x: n1.x + n1.w / 2,
        y: n1.y + n1.h
    });
    n1points.push({
        x: n1.x,
        y: n1.y + n1.h / 2
    });

    var n2points = [];
    n2points.push({
        x: n2.x + n2.w / 2,
        y: n2.y
    });
    n2points.push({
        x: n2.x + n2.w,
        y: n2.y + n2.h / 2
    });
    n2points.push({
        x: n2.x + n2.w / 2,
        y: n2.y + n2.h
    });
    n2points.push({
        x: n2.x,
        y: n2.y + n2.h / 2
    });

    var dist = null;
    var distPoint = {};
    for (var i = 0; i < n1points.length; i++) {
        for (var j = 0; j < n2points.length; j++) {
            var cur = Math.sqrt((n2points[j].x - n1points[i].x) * (n2points[j].x - n1points[i].x) + (n2points[j].y - n1points[i].y) * (n2points[j].y - n1points[i].y));
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
        start: n1points[distPoint.i],
        end: n2points[distPoint.j]
    }
}


function findShortestDistanceBetweenPointerAndNode(n1, p) {
    var n1points = [];
    n1points.push({
        x: n1.x + n1.w / 2,
        y: n1.y
    });
    n1points.push({
        x: n1.x + n1.w,
        y: n1.y + n1.h / 2
    });
    n1points.push({
        x: n1.x + n1.w / 2,
        y: n1.y + n1.h
    });
    n1points.push({
        x: n1.x,
        y: n1.y + n1.h / 2
    });


    var dist = null;
    var distPoint = null;
    for (var i = 0; i < n1points.length; i++) {
        var cur = Math.sqrt((p.x - n1points[i].x) * (p.x - n1points[i].x) + (p.y - n1points[i].y) * (p.y - n1points[i].y));
        if (dist == null) {
            dist = cur;
            distPoint = i;
        } else if (cur < dist) {
            distPoint = i;
            dist = cur;
        }
    }

    return {
        start: n1points[distPoint],
        end: p
    };
}

OrgChart.CLINK_CURVE = 0;

//each response nodes of a question
//are getting this parentId as their
// parent node id
var parentId;

var nodeArray = [
    { id: 1, name: "Press the button to ask any query" }
];

let questionArray = [

    {
        question: 'What kind of pain you feel',
        cid: [2, 3, 4, 5]
    },
    {
        question: 'why you are here',
        cid: [6, 7]
    },
    {
        question: 'what was the day',
        cid: [8, 9]
    },
    {
        question: 'what is your gender',
        cid: [10, 11]
    },
    {
        question: 'Are you feeling any pain today',
        cid: [12, 13]
    },
    {
        question: 'What is your activity today',
        cid: [14, 15]
    },
    {
        question: 'How did you sleep today',
        cid: [16, 17, 18]
    }
];

var responseNodes = [
    { id: 2, name: "Back pain" },
    { id: 3, name: "Headache" },
    { id: 4, name: "All body" },
    { id: 5, name: "Heart related" },
    { id: 6, name: "Visit" },
    { id: 7, name: "Treatment" },
    { id: 8, name: "Better" },
    { id: 9, name: "Not good" },
    { id: 10, name: "Male" },
    { id: 11, name: "Female" },
    { id: 12, name: "Yes" },
    { id: 13, name: "No" },
    { id: 14, name: "Getting well" },
    { id: 15, name: "Not good" },
    { id: 16, name: "Normal" },
    { id: 17, name: "Bad" },
    { id: 18, name: "Super" }
];



function autocomplete(inp, arr) {
    console.log(arr);
    var currentFocus;
    inp.addEventListener("input", function(e) {
        var a, b, i, val = this.value;
        console.log(val);
        /*close any already open lists of autocompleted values*/
        closeAllLists();
        if (!val) { return false; }
        currentFocus = -1;
        /*create a DIV element that will contain the items (values):*/
        a = document.createElement("DIV");
        a.setAttribute("id", this.id + "autocomplete-list");
        a.setAttribute("class", "autocomplete-items");
        /*append the DIV element as a child of the autocomplete container:*/
        this.parentNode.appendChild(a);
        for (i = 0; i < arr.length; i++) {
            console.log(arr[i].question);
            if (arr[i].question.toUpperCase().includes(val.toUpperCase())) {
                console.log(arr[i].question);
                b = document.createElement("DIV");
                b.innerHTML = arr[i].question;
                b.innerHTML += "<input type='hidden' value='" + arr[i].question + "'>";
                b.addEventListener("click", function(e) {
                    inp.value = this.getElementsByTagName("input")[0].value;
                    closeAllLists();
                });
                a.appendChild(b);
            }
        }
    });
    /*execute a function presses a key on the keyboard:*/
    inp.addEventListener("keydown", function(e) {
        var x = document.getElementById(this.id + "autocomplete-list");
        if (x) x = x.getElementsByTagName("div");
        if (e.keyCode == 40) {
            /*If the arrow DOWN key is pressed,
            increase the currentFocus variable:*/
            currentFocus++;
            /*and and make the current item more visible:*/
            addActive(x);
        } else if (e.keyCode == 38) { //up
            /*If the arrow UP key is pressed,
            decrease the currentFocus variable:*/
            currentFocus--;
            /*and and make the current item more visible:*/
            addActive(x);
        } else if (e.keyCode == 13) {
            /*If the ENTER key is pressed, prevent the form from being submitted,*/
            e.preventDefault();
            if (currentFocus > -1) {
                /*and simulate a click on the "active" item:*/
                if (x) x[currentFocus].click();
            }
        }
    });

    function addActive(x) {
        /*a function to classify an item as "active":*/
        if (!x) return false;
        /*start by removing the "active" class on all items:*/
        removeActive(x);
        if (currentFocus >= x.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = (x.length - 1);
        /*add class "autocomplete-active":*/
        x[currentFocus].classList.add("autocomplete-active");
    }

    function removeActive(x) {
        /*a function to remove the "active" class from all autocomplete items:*/
        for (var i = 0; i < x.length; i++) {
            x[i].classList.remove("autocomplete-active");
        }
    }

    function closeAllLists(elmnt) {
        /*close all autocomplete lists in the document,
        except the one passed as an argument:*/
        var x = document.getElementsByClassName("autocomplete-items");
        for (var i = 0; i < x.length; i++) {
            if (elmnt != x[i] && elmnt != inp) {
                x[i].parentNode.removeChild(x[i]);
            }
        }
    }
    /*execute a function when someone clicks in the document:*/
    document.addEventListener("click", function(e) {
        closeAllLists(e.target);
    });
}







var searchBar = document.getElementById('search-bar');

// searchBar.addEventListener('keyup', (e) => {
//     //searchBar.value = '';
//     let questionBox = document.getElementById('question-box');
//     while (questionBox.firstChild) {
//         questionBox.removeChild(questionBox.lastChild);
//     }
//     let filteredQuestion = questionArray.filter(res => {
//         if (e.target.value === '') return '';
//         return res.question.toLowerCase().includes(e.target.value.toLowerCase());
//     });
//     //console.log(filteredQuestion);
//     var div = document.createElement('div');

//     for (let i = 0; i < filteredQuestion.length; i++) {
//         let input = document.createElement('input');
//         input.style.width = '100%';
//         input.style.height = '30px';
//         input.style.background = 'white';
//         input.style.border = '1px solid lightgrey';
//         input.style.textAlign = 'left';
//         input.style.cursor = 'pointer';
//         input.value = filteredQuestion[i].question;
//         input.addEventListener('click', function() {
//             questionHandler(filteredQuestion[i]);
//         }, false);
//         div.appendChild(input);
//     }

//     questionBox.appendChild(div);

//     var span = document.getElementsByClassName("close")[0];
//     span.onclick = function() {
//         modal.style.display = "none";
//     }
// });

const addConditionHandler = (id) => {
    console.log(`add condition handler ${id}`);
}

const endSessionHandler = (id) => {
    nodeArray.push({ id: 0, pid: id, name: 'End Session' });
    chart.draw();
}

var modal = document.getElementById("myModal");

function questionHandler(str) {
    let parentNode = nodeArray.filter((res) => res.id === parentId);
    console.log(parentNode);
    parentNode[0].questionName = str.question;
    for (let i = 0; i < str.cid.length; i++) {
        for (let j = 0; j < responseNodes.length; j++) {
            if (responseNodes[j].id === str.cid[i]) {
                responseNodes[j].pid = parentId;
                nodeArray.push(responseNodes[j]);
            }
        }
    }

    modal.style.display = 'none';
    console.log(nodeArray);
    chart.draw();
}

const askQuestionHandler = (id) => {
    // let questionBox = document.getElementById('question-box');
    // while (questionBox.firstChild) {
    //     questionBox.removeChild(questionBox.lastChild);
    // }
    autocomplete(document.getElementById("search-bar"), questionArray);
    parentId = id;
    searchBar.value = '';
    modal.style.display = "block";
}

const removeHandler = (id) => {
    console.log('remove handler');
}


//customization in design of node field and menu button 
OrgChart.templates.ula.field_0 = '<text width="230" style="font-size: 15px;" fill="#000000" x="125" y="40" text-anchor="middle" class="field_0">{val}</text>';

OrgChart.templates.ula.field_1 = '<text width="230" style="font-size: 15px;" fill="#000000" x="125" y="60" text-anchor="middle" class="field_0">{val}</text>';

OrgChart.templates.ula.nodeMenuButton = '<g style="cursor:pointer;"  control-node-menu-id="{id}"><rect x="205" y="75"  fill="#0099ff"  style="width: 40px; height: 20px;" ></rect><text width="230" style="font-size: 12px; cursor: pointer;" fill="#000000" x="225" y="90" text-anchor="middle" class="field_0">Query</text></g>';

OrgChart.templates.ula.html = '<foreignobject class="node" x="20" y="10" width="200" height="100">{val}</foreignobject>';


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

        condition: {
            icon: "",
            text: "Add Condition",
            onClick: addConditionHandler
        },

        remove: {
            icon: "",
            text: "Remove Question",
            onClick: removeHandler
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

    nodes: nodeArray

});

//nothing will happen on chart node click
chart.on('click', (a, b) => {
    return false;
});