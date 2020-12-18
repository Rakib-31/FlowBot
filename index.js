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
    viewBox = JSON.parse(viewBox);

    var scaleX = w / viewBox[2];
    var scaleY = h / viewBox[3];

    var scale = scaleX > scaleY ? scaleY : scaleX;



    var fromnode = sender.getNode(this.getAttribute('node-id'));
    var tonode = null;


    var moveHandler = function(e) {
        if (tonode && (tonode.id != fromnode.id)) {
            //var shortest = findShortestDistance(fromnode, tonode);
            //line(svg, shortest.start, shortest.end);
            line(svg, tonode.middle, fromnode.middle);
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

var div = document.createElement('div');

for (let i = 0; i < questionArray.length; i++) {
    let button = document.createElement('button');
    button.style.width = '100%';
    button.style.height = '30px';
    button.innerHTML = questionArray[i].question;
    button.addEventListener('click', function() {
        questionHandler(questionArray[i]);
    }, false);
    div.appendChild(button);
}

document.getElementById('question-box').appendChild(div);

var span = document.getElementsByClassName("close")[0];
span.onclick = function() {
    modal.style.display = "none";
}

const addConditionHandler = (id) => {
    console.log(`add condition handler ${id}`);
}

const endSessionHandler = (id) => {
    console.log('end session handler');
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
        // let childNode = responseNodes.filter(res => res.id === str.cid[i]);
        // childNode[0].pid = parentId;
        // nodeArray.push(childNode[0]);
    }

    modal.style.display = 'none';
    console.log(nodeArray);
    chart.draw();
}

const askQuestionHandler = (id) => {
    parentId = id;
    modal.style.display = "block";
}

OrgChart.templates.ula.field_0 =
    '<text width="230" style="font-size: 15px;" fill="#000000" x="125" y="60" text-anchor="middle" class="field_0">{val}</text>';
OrgChart.templates.ula.field_1 =
    '<text width="230" style="font-size: 15px;" fill="#000000" x="125" y="80" text-anchor="middle" class="field_0">{val}</text>';

OrgChart.templates.ula.nodeMenuButton = '<g style="cursor:pointer;" transform="matrix(1,0,0,1,220,90)" control-node-menu-id="{id}"><rect  fill="#000000" fill-opacity="0" width="22" height="22"></rect><circle cx="0" cy="0" r="2" fill="#004165"></circle><circle cx="7" cy="0" r="2" fill="#004165"></circle><circle cx="14" cy="0" r="2" fill="#004165"></circle></g>';

OrgChart.templates.ula.html = '<foreignobject class="node" x="20" y="10" width="200" height="100">{val}</foreignobject>';

var chart = new OrgChart(document.getElementById("tree"), {
    mouseScrool: OrgChart.action.scroll,
    template: "ula",

    nodeMenu: {
        askQuestion: {
            icon: "",
            text: "Ask Question",
            onClick: askQuestionHandler
        },
        remove: { text: "Remove Question" },
        condition: {
            icon: "",
            text: "Add Condition",
            onClick: addConditionHandler
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



chart.on('click', (a, b) => {
    return false;
});