const burg1 = document.getElementById("burg-1");
const burg2 = document.getElementById("burg-2");
const burg3 = document.getElementById("burg-3");
const burger = document.querySelector(".burger");
const btn = document.querySelector(".btn")

function menuBar() {
    burg2.classList.toggle("active");
    burg3.classList.toggle("active");
    burg1.classList.toggle("active");
    burger.classList.toggle("active");
}


// Get the button element
var button = document.querySelector('.btn');

// Add event listener for the click event
button.addEventListener('click', function() {
    // Add the animation class
    button.classList.add('animate-click');
    
    // Remove the animation class after the animation ends
    setTimeout(function() {
        button.classList.remove('animate-click');
    }, 300); // Same duration as the animation
});
