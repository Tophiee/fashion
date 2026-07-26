/**
 * Study Configuration
 * Researchers should modify this file to configure the study details.
 */

const Config = {
    // Environment Mode: 'development', 'pilot', or 'production'
    ENVIRONMENT: 'production',
    
    // Replace with your Google Apps Script Web App URL
    SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbyqgj9MJuEvSCZLF9L0DSVtcqeKvtdr5LoXoI16jouE1ulbapitZuPuxbFEluBDP9LO/exec',

    // Researcher Information
    STUDY_TITLE: 'Design and Evaluation of an AI-Assisted Sustainable Wardrobe Recommendation System (EMS12334)',
    RESEARCHER_NAME: 'Oluwatofunmi Oluwole',
    RESEARCHER_EMAIL: '2506006@abertay.ac.uk',
    SUPERVISOR_NAME: 'Professor Vera Kempe & Professor Stefano De Paoli',
    SUPERVISOR_EMAIL: '', // Handled in UI
    
    // Estimated time in minutes
    ESTIMATED_TIME: '10–15',

    // Mock Dataset mapping perfectly to the provided image list
    MOCK_AI_DATA: [
        { image: "assets/images/Button-1.png", category: "Bottom", color: "Brown", brand: "Brown Skirt" },
        { image: "assets/images/Button-2.png", category: "Top", color: "Blue", brand: "Blue Sweatshirt" },
        { image: "assets/images/Button-3.png", category: "Footwear", color: "Black", brand: "Black Shoe" },
        { image: "assets/images/Button-4.png", category: "Footwear", color: "Black", brand: "Black Female Shoe" },
        { image: "assets/images/Button-5.png", category: "Footwear", color: "Brown", brand: "Brown Female Shoe" },
        { image: "assets/images/Button.png", category: "Bottom", color: "Blue", brand: "Jean Pant Trouser" },
        { image: "assets/images/Container-1.png", category: "Outerwear", color: "Multi", brand: "Complete Outfit" },
        { image: "assets/images/Container-2.png", category: "Top", color: "Red", brand: "Red Flowery Gown" },
        { image: "assets/images/Container-3.png", category: "Top", color: "White", brand: "White Gown" },
        { image: "assets/images/Container-4.png", category: "Top", color: "Grey", brand: "Grey Gown" },
        { image: "assets/images/Container-5.png", category: "Footwear", color: "Brown", brand: "Brown Heel Shoe" },
        { image: "assets/images/Container-6.png", category: "Footwear", color: "White", brand: "White Male Shoe" },
        { image: "assets/images/Container-7.png", category: "Footwear", color: "White", brand: "Female Heel" },
        { image: "assets/images/Container-8.png", category: "Accessory", color: "Brown", brand: "Brown Bag" },
        { image: "assets/images/Container-9.png", category: "Accessory", color: "Multi", brand: "Flowery Pattern Bag" },
        { image: "assets/images/Container-10.png", category: "Accessory", color: "Black", brand: "Black Bag" },
        { image: "assets/images/Container.png", category: "Outerwear", color: "Brown", brand: "Brown Complete Outfit" },
        { image: "assets/images/ImageWithFallback-1.png", category: "Top", color: "Red", brand: "Red Gown" },
        { image: "assets/images/ImageWithFallback.png", category: "Outerwear", color: "Black", brand: "Black Coat" }
    ]
};

window.Config = Config;
