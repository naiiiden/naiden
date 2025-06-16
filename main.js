let cursor = document.querySelector('.cursor');
let cursorLink = document.querySelector('.cursor-link');

function cursorPosition(cursorElement, xPosSubstractValue, yPosSubstractValue) {
  document.addEventListener('mousemove', (e) => {
    if (cursorElement.style.display != "none") {
      cursorElement.style.left = e.clientX - xPosSubstractValue + 'px';
      cursorElement.style.top = e.clientY - yPosSubstractValue + 'px';
    }
  });
}

cursorPosition(cursor, 3.5, 3.5);
cursorPosition(cursorLink, 14.5, 3.5);

cursorLink.style.display = "none";

document.querySelectorAll("body, body a").forEach((el) => {
  el.style.cursor = "url('bitmap.png'), auto";
});

function handleFirstMouseMove(e) {
  document.querySelectorAll("body, body a").forEach((el) => {
    el.style.cursor = "none";
  });

  document.removeEventListener("mousemove", handleFirstMouseMove);
}
document.addEventListener("mousemove", handleFirstMouseMove);

document.addEventListener("mouseover", (e) => {
  if (e.target.closest("a")) {
    cursor.style.display = "none";
    cursorLink.style.display = "block";
  } else {
    cursor.style.display = "block";
    cursorLink.style.display = "none";
  }
});

document.addEventListener("mouseleave", () => {
  cursor.style.display = "none";
  cursorLink.style.display = "none";
});

main2.addEventListener("mouseenter", () => {
  main1.classList.add("mirror");
});

main2.addEventListener("mouseleave", () => {
  main1.classList.remove("mirror");
});