const maxValues = {
    "bp":299.999,
    "fp":299.999,
    "cs":9.999,
    "ch":9.999,
    "ce":9.999,
    "cr":3.999
};

const minValues = {
    "bp":0,
    "fp":-50,
    "cs":0.001,
    "ch":0.001,
    "ce":0.001,
    "cr":0.001
};

const crLabels = {
    1 : "Recommended",
    2 : "Problematic in production",
    3 : "Substitute on scale-up",
    4 : "Avoid if possible, even in the lab"
}

const units = {
    "bp" : "deg C",
    "fp" : "deg C",
    "cs" : "1 best, 10 worst",
    "ch" : "1 best, 10 worst",
    "ce" : "1 best, 10 worst",
    "cr" : ""
}

function getOtherControl(elem)
    {
        // The other control shares the same prefix but has "max" switched for
        // "min", or vice versa, after the "_"
        const controlType = elem.id.split("_")[0];
        const maxOrMin = elem.id.split("_")[1];
        const otherControlType = (maxOrMin == "max") ? "min" : "max"
        const idString = "#" + controlType + "_" + otherControlType;
        return idString
    }

function getMinControl(elem)
    {
        // The element prefix prior to '_' conveniently identifies its type 
        const controlType = elem.id.split("_")[0];
        const idString = "#" + controlType + "_min";
        return idString
    }

function getMaxControl(elem)
    {
        // The element prefix prior to '_' conveniently identifies its type 
        const controlType = elem.id.split("_")[0];
        const idString = "#" + controlType + "_max";
        return idString
    }

function getBgBar(elem)
    {
        // The element prefix prior to '_' conveniently identifies its type 
        const controlType = elem.id.split("_")[0];
        const idString = "#" + controlType + "_bg_rect";
        return idString
    }

function getHiLite(elem)
    {
        // The element prefix prior to '_' conveniently identifies its type 
        const controlType = elem.id.split("_")[0];
        const idString = "#" + controlType + "_hilite";
        return idString        
    }

function getTextBox(elem)
    {
        // The element prefix prior to '_' conveniently identifies its type 
        const controlType = elem.id.split("_")[0];
        const idString = "#" + controlType + "_text";
        return idString        
    }

function getNotes(control, val, limitType)
    {
        if (control == "cr")
            {
                return "(" + crLabels[val] + ") "
            }
        else if (limitType == "max")
            {
                return "(" + units[control] + ")"
            }
        else
            {
                return ""
            }
    }

function getControlText(elem,min,max)
    {
        const controlType = elem.id.split("_")[0];
        const minLimit = minValues[controlType];
        const maxLimit = maxValues[controlType];
        const minValue = Math.ceil(minLimit + min * (maxLimit - minLimit));
        const maxValue = Math.ceil(minLimit + max * (maxLimit - minLimit));
        const noteMin = getNotes(controlType, minValue, "min");
        const noteMax = getNotes(controlType, maxValue, "max");
        return `Selected range: ${minValue} ` + noteMin + `to ${maxValue} ` + noteMax; 
    }

function dragmove() 
    {
    const otherControlID = getOtherControl(this);
    let otherControlData = d3.select(otherControlID).node().getBoundingClientRect();
    const offset = d3.select(this).node().parentNode.getBoundingClientRect().x;
    const bgBarID = getBgBar(this);
    const bgBarData = d3.select(bgBarID).node().getBoundingClientRect();
    const hiLiteID = getHiLite(this);
    const barEdgeLeft = barWidth / 16;
    const barEdgeRight = 15 * barWidth / 16;
    let newX = d3.event.x;
    // Control id either ends in "_max" or "_min" so we can classify as "max" or "min"
    const maxOrMin = this.id.split("_")[1];
    if (maxOrMin == "max")
        {
            if (newX > barEdgeRight)
                {
                    newX = barEdgeRight;
                }
            // The left bound for the max-controller needs to leave room for
            // the min-controller so it is not forced off the bar 
            if (newX < (barEdgeLeft + triangleHalfWidth + 1))
                {
                    newX = barEdgeLeft + triangleHalfWidth + 1;
                }
            d3.select(this)
                .attr("points",`${newX - triangleHalfWidth},\
                ${triangleYCenter - triangleHalfHeight} \
                ${newX + triangleHalfWidth},\
                ${triangleYCenter - triangleHalfHeight} \
                ${newX},\
                ${triangleYCenter + triangleHalfHeight}`);   
            const separation = newX + offset - otherControlData.right;
            if (separation < 1)
                {
                    // Push the min-controller to keep it left of the max-controller
                    const otherX = newX - triangleHalfWidth - 1;
                    d3.select(otherControlID)
                    .attr("points",`${otherX - triangleHalfWidth},\
                    ${triangleYCenter + triangleHalfHeight} \
                    ${otherX + triangleHalfWidth},\
                    ${triangleYCenter + triangleHalfHeight} \
                    ${otherX},\
                    ${triangleYCenter - triangleHalfHeight}`);      
                }
        }
    else
        {
            // The min-controller's right limit needs to account for leaving enough
            // room on the bar for the max-controller to fit to its right
            if (newX > (barEdgeRight - triangleHalfWidth - 1))
            {
                newX = barEdgeRight - triangleHalfWidth - 1;
            }
        if (newX < barEdgeLeft)
            {
                newX = barEdgeLeft;
            }
        d3.select(this)
            .attr("points",`${newX - triangleHalfWidth},\
            ${triangleYCenter + triangleHalfHeight} \
            ${newX + triangleHalfWidth},\
            ${triangleYCenter + triangleHalfHeight} \
            ${newX},\
            ${triangleYCenter - triangleHalfHeight}`);   
        const separation = otherControlData.left - newX - offset;
        if (separation < 1)
            {
                // Push the max-controller to keep it right of the min-controller
                const otherX = newX + triangleHalfWidth + 1;
                d3.select(otherControlID)
                .attr("points",`${otherX - triangleHalfWidth},\
                ${triangleYCenter - triangleHalfHeight} \
                ${otherX + triangleHalfWidth},\
                ${triangleYCenter - triangleHalfHeight} \
                ${otherX},\
                ${triangleYCenter + triangleHalfHeight}`);      
            }            
        }
        // Once controls are re-located, re-load their features and adjust the 
        // remaining graphical elements 
        let thisControlData = d3.select(this).node().getBoundingClientRect();
        otherControlData = d3.select(otherControlID).node().getBoundingClientRect();
        const controlRange = [thisControlData.x + thisControlData.width / 2,
                               otherControlData.x + otherControlData.width / 2].sort();
        d3.select(hiLiteID)
            .attr("x",controlRange[0] - bgBarData.x + barWidth / 16)
            .attr("width",controlRange[1] - controlRange[0]);
        // Convert the control range to lie within [0,1] to allow getControlText to
        // work in a uniform way.
        const normalizedMin = (controlRange[0] - bgBarData.x) / bgBarData.width;
        const normalizedMax = (controlRange[1] - bgBarData.x) / bgBarData.width;
        const controlText = getControlText(this, normalizedMin, normalizedMax);
        const textBoxID = getTextBox(this);
        d3.select(textBoxID)
            .text(controlText);
    }
    
function handleBarClick() 
    {
    const minControlID = getMinControl(this);
    const maxControlID = getMaxControl(this);
    const bgBarID = getBgBar(this);
    const bgBarData = d3.select(bgBarID).node().getBoundingClientRect();
    const hiLiteID = getHiLite(this);
    // Use the mid-point of the two controls as a dividing line
    // Any click to the right moves the maxControl (which is always on the right)
    // Otherwise it moves tne minControl
    let minControlData = d3.select(minControlID).node().getBoundingClientRect();
    let maxControlData = d3.select(maxControlID).node().getBoundingClientRect();
    const midPoint = (minControlData.x + minControlData.width +
        maxControlData.x + maxControlData.width) / 2;
    let clickPoint = d3.event.x;
    if (clickPoint > midPoint)
        {
        // Check that the click is within the background bar
        const bgBarEdge = bgBarData.x + bgBarData.width;
        if (clickPoint > bgBarEdge)
            {
                clickPoint = bgBarEdge;
            }
        const clickX = clickPoint - bgBarData.x + barWidth / 16;
        d3.select(maxControlID)
            .attr("points",`${clickX - triangleHalfWidth},\
            ${triangleYCenter - triangleHalfHeight} \
            ${clickX + triangleHalfWidth},\
            ${triangleYCenter - triangleHalfHeight} \
            ${clickX},\
            ${triangleYCenter + triangleHalfHeight}`);   
        }
        else
        {
        // Check that the click is within the background bar
        const bgBarEdge = bgBarData.x;
        if (clickPoint < bgBarEdge)
            {
                clickPoint = bgBarEdge;
            }
        const clickX = clickPoint - bgBarData.x + barWidth / 16;
        d3.select(minControlID)
            .attr("points",`${clickX - triangleHalfWidth},\
            ${triangleYCenter + triangleHalfHeight} \
            ${clickX + triangleHalfWidth},\
            ${triangleYCenter + triangleHalfHeight} \
            ${clickX},\
            ${triangleYCenter - triangleHalfHeight}`);               
        }
        // Once controls are re-located, re-load their features and adjust the 
        // remaining graphical elements 
        minControlData = d3.select(minControlID).node().getBoundingClientRect();
        maxControlData = d3.select(maxControlID).node().getBoundingClientRect();
        const controlRange = [minControlData.x + minControlData.width / 2,
                               maxControlData.x + maxControlData.width / 2];
        d3.select(hiLiteID)
            .attr("x",controlRange[0] - bgBarData.x + barWidth / 16)
            .attr("width",controlRange[1] - controlRange[0]);
        // Convert the control range to lie within [0,1] to allow getControlText to
        // work in a uniform way.
        const normalizedMin = (controlRange[0] - bgBarData.x) / bgBarData.width;
        const normalizedMax = (controlRange[1] - bgBarData.x) / bgBarData.width;
        const controlText = getControlText(this, normalizedMin, normalizedMax);
        const textBoxID = getTextBox(this);
        d3.select(textBoxID)
            .text(controlText);
    }

var handleDrag = d3.drag()
            .on("drag", dragmove);

// Global attributes for all bars
var colData = d3.select("#input_col").node().getBoundingClientRect();
var barWidth = colData.width * 0.75;
var barHeight = Math.min(barWidth / 8, 10);
var barYCenter = barHeight;
var triangleHalfHeight = barHeight / 2 + 2;
var triangleHalfWidth = triangleHalfHeight;
var triangleYCenter = barYCenter;

// Selection filter control elements 
var barBP = d3.select("#bp_slider")
              .append("svg")
              .attr("id","bp_bar")
              .attr("width",barWidth)
              .attr("height",2*barHeight);

barBP.append("rect")
    .attr("id","bp_bg_rect")
    .attr("x",barWidth / 16)
    .attr("y",barYCenter - barHeight / 2)
    .attr("width",barWidth * 7 / 8)
    .attr("height",barHeight)
    .attr("rx",5)
    .attr("ry",5)
    .attr("stroke","black")
    .attr("stroke-width","1px")
    .attr("fill","darkgrey");

barBP.append("rect")
    .attr("id","bp_hilite")
    .attr("x",barWidth / 16)
    .attr("y",barYCenter - triangleHalfHeight)
    .attr("width",barWidth * 7 / 8)
    .attr("height",2 * triangleHalfHeight)
    .attr("stroke","None")
    .attr("fill","rgb(128,128,255)")
    .attr("fill-opacity",0.5);

maxBPControl = barBP.append("polygon")
    .attr("id","bp_max")
    .attr("points",`${barWidth * 15 / 16 - triangleHalfWidth},\
        ${triangleYCenter - triangleHalfHeight} \
        ${barWidth * 15 / 16 + triangleHalfWidth},\
        ${triangleYCenter - triangleHalfHeight} \
        ${barWidth * 15 / 16},\
        ${triangleYCenter + triangleHalfHeight}`)
    .attr("stroke","darkblue")
    .attr("stroke-width","1px")
    .attr("fill","blue");

minBPControl = barBP.append("polygon")
    .attr("id","bp_min")
    .attr("points",`${barWidth * 1 / 16 - triangleHalfWidth},\
        ${triangleYCenter + triangleHalfHeight} \
        ${barWidth * 1 / 16 + triangleHalfWidth},\
        ${triangleYCenter + triangleHalfHeight} \
        ${barWidth * 1 / 16},\
        ${triangleYCenter - triangleHalfHeight}`)
    .attr("stroke","darkblue")
    .attr("stroke-width","1px")
    .attr("fill","blue");

var barFP = d3.select("#fp_slider")
    .append("svg")
    .attr("id","fp_bar")
    .attr("width",barWidth)
    .attr("height",2*barHeight);

barFP.append("rect")
    .attr("id","fp_bg_rect")
    .attr("x",barWidth / 16)
    .attr("y",barYCenter - barHeight / 2)
    .attr("width",barWidth * 7 / 8)
    .attr("height",barHeight)
    .attr("rx",5)
    .attr("ry",5)
    .attr("stroke","black")
    .attr("stroke-width","1px")
    .attr("fill","darkgrey");    

barFP.append("rect")
    .attr("id","fp_hilite")
    .attr("x",barWidth / 16)
    .attr("y",barYCenter - triangleHalfHeight)
    .attr("width",barWidth * 7 / 8)
    .attr("height",2 * triangleHalfHeight)
    .attr("stroke","None")
    .attr("fill","rgb(128,128,255)")
    .attr("fill-opacity",0.5);

maxFPControl = barFP.append("polygon")
    .attr("id","fp_max")
    .attr("points",`${barWidth * 15 / 16 - triangleHalfWidth},\
        ${triangleYCenter - triangleHalfHeight} \
        ${barWidth * 15 / 16 + triangleHalfWidth},\
        ${triangleYCenter - triangleHalfHeight} \
        ${barWidth * 15 / 16},\
        ${triangleYCenter + triangleHalfHeight}`)
    .attr("stroke","darkblue")
    .attr("stroke-width","1px")
    .attr("fill","blue");

minFPControl = barFP.append("polygon")
    .attr("id","fp_min")
    .attr("points",`${barWidth * 1 / 16 - triangleHalfWidth},\
        ${triangleYCenter + triangleHalfHeight} \
        ${barWidth * 1 / 16 + triangleHalfWidth},\
        ${triangleYCenter + triangleHalfHeight} \
        ${barWidth * 1 / 16},\
        ${triangleYCenter - triangleHalfHeight}`)
    .attr("stroke","darkblue")
    .attr("stroke-width","1px")
    .attr("fill","blue");

var barCS = d3.select("#cs_slider")
    .append("svg")
    .attr("id","cs_bar")
    .attr("width",barWidth)
    .attr("height",2*barHeight);

barCS.append("rect")
    .attr("id","cs_bg_rect")
    .attr("x",barWidth / 16)
    .attr("y",barYCenter - barHeight / 2)
    .attr("width",barWidth * 7 / 8)
    .attr("height",barHeight)
    .attr("rx",5)
    .attr("ry",5)
    .attr("stroke","black")
    .attr("stroke-width","1px")
    .attr("fill","darkgrey");

barCS.append("rect")
    .attr("id","cs_hilite")
    .attr("x",barWidth / 16)
    .attr("y",barYCenter - triangleHalfHeight)
    .attr("width",barWidth * 7 / 8)
    .attr("height",2 * triangleHalfHeight)
    .attr("stroke","None")
    .attr("fill","rgb(128,128,255)")
    .attr("fill-opacity",0.5);

maxCSControl = barCS.append("polygon")
    .attr("id","cs_max")
    .attr("points",`${barWidth * 15 / 16 - triangleHalfWidth},\
        ${triangleYCenter - triangleHalfHeight} \
        ${barWidth * 15 / 16 + triangleHalfWidth},\
        ${triangleYCenter - triangleHalfHeight} \
        ${barWidth * 15 / 16},\
        ${triangleYCenter + triangleHalfHeight}`)
    .attr("stroke","darkblue")
    .attr("stroke-width","1px")
    .attr("fill","blue");

minCSControl = barCS.append("polygon")
    .attr("id","cs_min")
    .attr("points",`${barWidth * 1 / 16 - triangleHalfWidth},\
        ${triangleYCenter + triangleHalfHeight} \
        ${barWidth * 1 / 16 + triangleHalfWidth},\
        ${triangleYCenter + triangleHalfHeight} \
        ${barWidth * 1 / 16},\
        ${triangleYCenter - triangleHalfHeight}`)
    .attr("stroke","darkblue")
    .attr("stroke-width","1px")
    .attr("fill","blue");

var barCH = d3.select("#ch_slider")
    .append("svg")
    .attr("id","ch_bar")
    .attr("width",barWidth)
    .attr("height",2*barHeight);

barCH.append("rect")
    .attr("id","ch_bg_rect")
    .attr("x",barWidth / 16)
    .attr("y",barYCenter - barHeight / 2)
    .attr("width",barWidth * 7 / 8)
    .attr("height",barHeight)
    .attr("rx",5)
    .attr("ry",5)
    .attr("stroke","black")
    .attr("stroke-width","1px")
    .attr("fill","darkgrey");

barCH.append("rect")
    .attr("id","ch_hilite")
    .attr("x",barWidth / 16)
    .attr("y",barYCenter - triangleHalfHeight)
    .attr("width",barWidth * 7 / 8)
    .attr("height",2 * triangleHalfHeight)
    .attr("stroke","None")
    .attr("fill","rgb(128,128,255)")
    .attr("fill-opacity",0.5);

maxCHControl = barCH.append("polygon")
    .attr("id","ch_max")
    .attr("points",`${barWidth * 15 / 16 - triangleHalfWidth},\
        ${triangleYCenter - triangleHalfHeight} \
        ${barWidth * 15 / 16 + triangleHalfWidth},\
        ${triangleYCenter - triangleHalfHeight} \
        ${barWidth * 15 / 16},\
        ${triangleYCenter + triangleHalfHeight}`)
    .attr("stroke","darkblue")
    .attr("stroke-width","1px")
    .attr("fill","blue");

minCHControl = barCH.append("polygon")
    .attr("id","ch_min")
    .attr("points",`${barWidth * 1 / 16 - triangleHalfWidth},\
        ${triangleYCenter + triangleHalfHeight} \
        ${barWidth * 1 / 16 + triangleHalfWidth},\
        ${triangleYCenter + triangleHalfHeight} \
        ${barWidth * 1 / 16},\
        ${triangleYCenter - triangleHalfHeight}`)
    .attr("stroke","darkblue")
    .attr("stroke-width","1px")
    .attr("fill","blue");

var barCE = d3.select("#ce_slider")
    .append("svg")
    .attr("id","ce_bar")
    .attr("width",barWidth)
    .attr("height",2*barHeight);

barCE.append("rect")
    .attr("id","ce_bg_rect")
    .attr("x",barWidth / 16)
    .attr("y",barYCenter - barHeight / 2)
    .attr("width",barWidth * 7 / 8)
    .attr("height",barHeight)
    .attr("rx",5)
    .attr("ry",5)
    .attr("stroke","black")
    .attr("stroke-width","1px")
    .attr("fill","darkgrey");

barCE.append("rect")
    .attr("id","ce_hilite")
    .attr("x",barWidth / 16)
    .attr("y",barYCenter - triangleHalfHeight)
    .attr("width",barWidth * 7 / 8)
    .attr("height",2 * triangleHalfHeight)
    .attr("stroke","None")
    .attr("fill","rgb(128,128,255)")
    .attr("fill-opacity",0.5);

maxCEControl = barCE.append("polygon")
    .attr("id","ce_max")
    .attr("points",`${barWidth * 15 / 16 - triangleHalfWidth},\
        ${triangleYCenter - triangleHalfHeight} \
        ${barWidth * 15 / 16 + triangleHalfWidth},\
        ${triangleYCenter - triangleHalfHeight} \
        ${barWidth * 15 / 16},\
        ${triangleYCenter + triangleHalfHeight}`)
    .attr("stroke","darkblue")
    .attr("stroke-width","1px")
    .attr("fill","blue");

minCEControl = barCE.append("polygon")
    .attr("id","ce_min")
    .attr("points",`${barWidth * 1 / 16 - triangleHalfWidth},\
        ${triangleYCenter + triangleHalfHeight} \
        ${barWidth * 1 / 16 + triangleHalfWidth},\
        ${triangleYCenter + triangleHalfHeight} \
        ${barWidth * 1 / 16},\
        ${triangleYCenter - triangleHalfHeight}`)
    .attr("stroke","darkblue")
    .attr("stroke-width","1px")
    .attr("fill","blue");

var barCR = d3.select("#cr_slider")
    .append("svg")
    .attr("id","cr_bar")
    .attr("width",barWidth)
    .attr("height",2*barHeight);

barCR.append("rect")
    .attr("id","cr_bg_rect")
    .attr("x",barWidth / 16)
    .attr("y",barYCenter - barHeight / 2)
    .attr("width",barWidth * 7 / 8)
    .attr("height",barHeight)
    .attr("rx",5)
    .attr("ry",5)
    .attr("stroke","black")
    .attr("stroke-width","1px")
    .attr("fill","darkgrey");

barCR.append("rect")
    .attr("id","cr_hilite")
    .attr("x",barWidth / 16)
    .attr("y",barYCenter - triangleHalfHeight)
    .attr("width",barWidth * 7 / 8)
    .attr("height",2 * triangleHalfHeight)
    .attr("stroke","None")
    .attr("fill","rgb(128,128,255)")
    .attr("fill-opacity",0.5);

maxCRControl = barCR.append("polygon")
    .attr("id","cr_max")
    .attr("points",`${barWidth * 15 / 16 - triangleHalfWidth},\
        ${triangleYCenter - triangleHalfHeight} \
        ${barWidth * 15 / 16 + triangleHalfWidth},\
        ${triangleYCenter - triangleHalfHeight} \
        ${barWidth * 15 / 16},\
        ${triangleYCenter + triangleHalfHeight}`)
    .attr("stroke","darkblue")
    .attr("stroke-width","1px")
    .attr("fill","blue");

minCRControl = barCR.append("polygon")
    .attr("id","cr_min")
    .attr("points",`${barWidth * 1 / 16 - triangleHalfWidth},\
        ${triangleYCenter + triangleHalfHeight} \
        ${barWidth * 1 / 16 + triangleHalfWidth},\
        ${triangleYCenter + triangleHalfHeight} \
        ${barWidth * 1 / 16},\
        ${triangleYCenter - triangleHalfHeight}`)
    .attr("stroke","darkblue")
    .attr("stroke-width","1px")
    .attr("fill","blue");

handleDrag(minBPControl);
handleDrag(maxBPControl);
handleDrag(minFPControl);
handleDrag(maxFPControl);
handleDrag(minCSControl);
handleDrag(maxCSControl);
handleDrag(minCHControl);
handleDrag(maxCHControl);
handleDrag(minCEControl);
handleDrag(maxCEControl);
handleDrag(minCRControl);
handleDrag(maxCRControl);
barBP.on("click", handleBarClick);
barFP.on("click", handleBarClick);
barCS.on("click", handleBarClick);
barCH.on("click", handleBarClick);
barCE.on("click", handleBarClick);
barCR.on("click", handleBarClick);

