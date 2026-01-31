// Add new unicorn assets to the existing ASSETS array
if (typeof ASSETS !== 'undefined') {
    ASSETS.push(
        {
            name: "Unicorn Jump",
            type: 'image',
            src: 'images/unicorn_jump.png'
        },
        {
            name: "Sweet Tooth",
            type: 'image',
            src: 'images/unicorn_icecream.png'
        },
        {
            name: "Sleepy Time",
            type: 'image',
            src: 'images/unicorn_sleep.png'
        }
    );
    console.log("New assets loaded!");
}
