function highlightMapArea(name,color){
    if(name == ''){return}
    el = document.getElementById(name);
    el.style.fill  = color;
}
function listElementMouseover(e){
    highlightMapArea(e.target.textContent.toLowerCase(),'black');
}
function allCountriesListElement(root){
    el = document.createElement("div");
    el.classList.add('listElement');
    root.append(el);
    return el;
}
