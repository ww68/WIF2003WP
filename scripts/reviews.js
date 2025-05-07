document.addEventListener('DOMContentLoaded', function () {
    const stars = document.querySelectorAll('.star');
    const submitBtn = document.getElementById('submit');
    const reviewInput = document.getElementById('comment');
    const reviewList = document.getElementById('review-list');
    const ratingNumber = document.getElementById('rating-number');
    const username = "User123";
    let currentRating = 0;

    // Function to save reviews to localStorage
    function saveReviews() {
        const reviews = [];
        const allReviews = document.querySelectorAll('.review');
        allReviews.forEach(review => {
            const rating = parseFloat(review.querySelector('.review-stars').getAttribute('data-rating'));
            const comment = review.querySelector('.review-comment').textContent;
            const dateTime = review.querySelector('.timestamp').textContent;
            reviews.push({ rating, comment, dateTime });
        });
        localStorage.setItem('reviews', JSON.stringify(reviews));
    }

    // Function to load reviews from localStorage
    function loadReviews() {
        const savedReviews = JSON.parse(localStorage.getItem('reviews'));
        if (savedReviews) {
            savedReviews.forEach(review => {
                addReviewToDOM(review.rating, review.comment, review.dateTime);
            });
        }
    }

    function getCurrentDateTime() {
        const now = new Date();
        return now.toLocaleString(); // Example: 5/8/2025, 3:21:45 PM
    }

    function addReviewToDOM(rating, comment, dateTime = getCurrentDateTime()) {
        let starsHTML = "";
        const fullStars = Math.floor(rating);
        const halfStar = rating % 1 >= 0.5;

        for (let i = 0; i < fullStars; i++) starsHTML += "★";
        if (halfStar) starsHTML += "☆";
        for (let i = starsHTML.length; i < 5; i++) starsHTML += "✩";

        const reviewItem = document.createElement('div');
        reviewItem.classList.add('review');
        reviewItem.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <p><strong>${username}</strong> rated it:</p>
                <div class="menu" style="position: relative;">
                    <button class="menu-btn" style="border: none; background: transparent; font-size: 18px; cursor: pointer;">⋮</button>
                    <div class="menu-options" style="display: none; position: absolute; right: 0; background: white; border: 1px solid #ccc; z-index: 100;">
                        <button class="delete-btn">Delete</button>
                    </div>
                </div>
            </div>
            <div class="review-stars" data-rating="${rating}">${starsHTML}</div>
            <p class="review-comment">${comment}</p> <!-- Added class to the comment for proper targeting -->
            <p class="timestamp" style="font-size: 12px; color: gray;">${dateTime}</p> <!-- Date/time -->
            <hr>
        `;
        reviewList.prepend(reviewItem);

        // Toggle menu
        reviewItem.querySelector('.menu-btn').addEventListener('click', (e) => {
            const menu = reviewItem.querySelector('.menu-options');
            menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
            e.stopPropagation();
        });

        // Close menu on document click
        document.addEventListener('click', () => {
            const menu = reviewItem.querySelector('.menu-options');
            if (menu) menu.style.display = 'none';
        });

        // Delete review
        reviewItem.querySelector('.delete-btn').addEventListener('click', () => {
            reviewItem.remove();
            saveReviews();
        });
    }

    loadReviews();

    stars.forEach(star => {
        star.addEventListener('click', function () {
            const rating = parseFloat(this.getAttribute('data-value'));
            currentRating = rating;
            updateStars(rating);
            updateRatingNumber(rating);
        });

        star.addEventListener('mouseover', function () {
            const rating = parseFloat(this.getAttribute('data-value'));
            updateStars(rating, true);
        });

        star.addEventListener('mouseout', function () {
            updateStars(currentRating);
        });
    });

    submitBtn.addEventListener('click', (event) => {
        event.preventDefault();

        const reviewText = reviewInput.value.trim();
        const rating = parseFloat(ratingNumber.textContent);

        if (!reviewText || rating === 0) {
            alert("Please enter a review and select a rating.");
            return;
        }

        alert("Your ratings and reviews have been posted.");
        addReviewToDOM(rating, reviewText);
        saveReviews();

        reviewInput.value = "";
        ratingNumber.textContent = '0';
        updateStars(0);
    });

    function updateStars(rating, isHover = false) {
        stars.forEach((star, index) => {
            const starValue = index + 1;
            star.classList.remove('selected', 'half', 'hover');
            if (starValue <= rating) {
                star.classList.add('selected');
            } else if (starValue - 0.5 === rating) {
                star.classList.add('half');
            }
            if (isHover && starValue <= rating) {
                star.classList.add('hover');
            }
        });
    }

    function updateRatingNumber(rating) {
        const roundedRating = (Math.round(rating * 2) / 2).toFixed(1);
        ratingNumber.textContent = roundedRating;
    }
});
