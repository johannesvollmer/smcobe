import getCaretCoordinates from "./position.js";

import { generatePain } from "./API.js";
document.querySelecto = document.querySelector.bind(document);
const get1 = document.querySelecto.bind(document);
const getn = document.querySelectorAll.bind(document);

const errorMessageOrEmpty = window.location.hash
get1("#console").value =
  errorMessageOrEmpty ? atob(errorMessageOrEmpty.substring(1)) + "\n\n\\C: > " :
    "\nsmc0be systewmiks imc. \nvirson 2.4.2C0BE\n\n\\C: > ".toUpperCase();

if (errorMessageOrEmpty)
  get1("#console").classList.add("error")

let url = "";

get1("#console").focus();

const DOS = get1("#console");

let lastEndPosition = DOS.value.length;

get1("#console").addEventListener("keyup", ({ key, keyCode, target }) => {
  if (keyCode === 13) {
    if (Math.random() < 0.1) {
      target.value = `${target.value}\\C: > `;
      url = "";
    } else if (url.toLowerCase() === "smboat" || url.toLowerCase().includes("gallery/shift#")) {
      location.href = url;
    } else if (url.toLowerCase().includes("help")) {
      target.value = `${target.value}what floats your toad at swcoad? the evil twin must hit the road\n\\C: > `;
    } else {
      target.value = `${target.value} \\C: >\n`;
      target.value += `\n ${generatePain(
        4
      )}\n\\C: > ERRO>R!!1!1!!! responwse from <!-- https/:/www3.${url}.org:1 -->\n      dows not countain found: "${url}"\n\n\\C: > `;
      get1("#console").scrollTop = get1("#console").scrollHeight;
      url = "";
    }
    lastEndPosition = DOS.value.length;
  } else url += key;
  resize();
});

// Caret

const element = get1("#console");

const rect = document.createElement("div");
document.body.appendChild(rect);
rect.style.position = "absolute";
rect.className = "carret";

function update() {
  const coordinates = getCaretCoordinates(element, element.selectionEnd);
  rect.style.top =
    element.offsetTop - element.scrollTop + coordinates.top + "px";
  rect.style.left =
    element.offsetLeft - element.scrollLeft + coordinates.left + "px";

  console.log(DOS.selectionEnd);
  if (DOS.selectionEnd < lastEndPosition) {
    // DOS.focus();
    DOS.setSelectionRange(lastEndPosition, lastEndPosition);
    DOS.scrollTo(0, DOS.scrollHeight);
  }

  requestAnimationFrame(() => {
    update();
  });
}
update();

window.addEventListener("resize", resize);

function resize() {
  const DOSstyle = getComputedStyle(DOS);

  DOS.style.cssText = `--line-height: ${parseInt(DOSstyle.height) / Math.floor(parseInt(DOSstyle.height) / 25)
    }px`;
  // DOS.focus();
  DOS.setSelectionRange(DOS.value.length, DOS.value.length);
  DOS.scrollTo(0, DOS.scrollHeight);
}
resize();
