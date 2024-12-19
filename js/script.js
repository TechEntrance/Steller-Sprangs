document.addEventListener('DOMContentLoaded', function() {
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const fullscreenMenu = document.querySelector('.fullscreen-menu');
    
    menuBtn.addEventListener('click', function() {
        this.classList.toggle('active');
        fullscreenMenu.classList.toggle('active');
        
        // Prevent body scrolling when menu is open
        document.body.style.overflow = fullscreenMenu.classList.contains('active') ? 'hidden' : '';
    });

    // Close menu when clicking menu items
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            menuBtn.classList.remove('active');
            fullscreenMenu.classList.remove('active');
            document.body.style.overflow = '';
        });
    });

    // Slider functionality
    const solutionCards = document.querySelectorAll('.solution-card');
    const dots = document.querySelectorAll('.dot');
    const cardsToShow = 3; // Number of cards to display at a time
    let currentIndex = 0;

    function showCards(index) {
        const totalCards = solutionCards.length;
        const totalDots = Math.ceil(totalCards / cardsToShow); // Calculate total dots based on cards

        // Calculate the starting and ending indices for the visible cards
        const startIndex = index * cardsToShow;
        const endIndex = startIndex + cardsToShow;

        // Show or hide cards based on their index
        solutionCards.forEach((card, i) => {
            card.style.display = (i >= startIndex && i < endIndex) ? 'block' : 'none';
        });

        // Update dots to reflect the current active dot
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });
    }

    // Add click event to each dot
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            currentIndex = index; // Update current index based on clicked dot
            showCards(currentIndex); // Show the corresponding cards
        });
    });

    // Initialize the first set of cards
    showCards(currentIndex);
});

