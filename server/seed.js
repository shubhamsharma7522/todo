require('dotenv').config();
const mongoose = require('mongoose');
const Vehicle = require('./models/Vehicle');

const vehicles = [
    // Sedan
    {
        name: 'Mercedes E 220d',
        brand: 'Mercedes',
        category: 'sedan',
        fuelType: 'Diesel',
        transmission: 'Automatic',
        seats: 5,
        color: 'White',
        pricePerDay: 9500,
        image: './media/vehicles/mercedes-e220d.jpg',
        description: 'Luxury chauffeur-driven sedan with premium interiors, smooth highway comfort, business-class travel experience, and advanced safety features.',
        travelUsage: 'Executive business transit, VIP transfers, and premium outstation trips.',
        comfortFeatures: 'Panoramic sunroof, dual-zone temperature control, premium leather reclining seats, Burmester sound.',
        suitableTravelType: 'VIP Corporate Sightseeing, Luxury Business Transit',
        available: true
    },
    {
        name: 'MG Cyberster',
        brand: 'MG',
        category: 'sedan',
        fuelType: 'Electric',
        transmission: 'Automatic',
        seats: 2,
        color: 'White',
        pricePerDay: 16500,
        image: './media/vehicles/mg-cyberster.jpg',
        description: 'Futuristic electric sports car with aggressive styling, premium cockpit, high acceleration, and luxury open-top driving experience.',
        travelUsage: 'Premium city cruises, luxury leisure drives, and open-top experiential touring.',
        comfortFeatures: 'F1-inspired scissor doors, electric folding soft-top roof, premium digital dashboard, Bose audio.',
        suitableTravelType: 'Experiential Leisure, Sports Road Trips, Luxury Shoots',
        available: true
    },
    {
        name: 'Porsche Boxster',
        brand: 'Porsche',
        category: 'sedan',
        fuelType: 'Petrol',
        transmission: 'Automatic',
        seats: 2,
        color: 'Red',
        pricePerDay: 18000,
        image: './media/vehicles/porsche-boxster.jpg',
        description: 'Iconic performance roadster offering thrilling driving dynamics, premium interiors, and a high-end touring experience.',
        travelUsage: 'High-end leisure travel, sports touring, and premium outstation weekend road trips.',
        comfortFeatures: 'Mid-engine performance chassis, premium leather bucket seats, active suspension, high-fidelity acoustics.',
        suitableTravelType: 'Elite Sports Touring, Scenic Mountain Passes, Experiential Road Trips',
        available: true
    },
    {
        name: 'Audi A6',
        brand: 'Audi',
        category: 'sedan',
        fuelType: 'Petrol',
        transmission: 'Automatic',
        seats: 5,
        color: 'White',
        pricePerDay: 9000,
        image: './media/vehicles/audi-a6.jpg',
        description: 'Elegant luxury sedan with advanced technology, spacious interiors, silent cabin comfort, and executive-class travel.',
        travelUsage: 'Business executive transfers, diplomatic meetings, and smooth highway family travel.',
        comfortFeatures: 'Matrix LED headlamps, virtual cockpit plus, acoustic soundproof glass, electric rear sunshade.',
        suitableTravelType: 'Executive Business Transit, Chauffeur-Driven City Tours',
        available: true
    },
    {
        name: 'Mercedes-Benz S-Class',
        brand: 'Mercedes-Benz',
        category: 'sedan',
        fuelType: 'Petrol',
        transmission: 'Automatic',
        seats: 5,
        color: 'Black',
        pricePerDay: 15000,
        image: './media/vehicles/mercedes-s-class.jpg',
        description: 'Flagship luxury sedan designed for VIP travel with unmatched comfort, ambient interiors, and elite chauffeur experience.',
        travelUsage: 'VIP state visits, HNWI transport, and ultimate luxury chauffeur drives.',
        comfortFeatures: 'Nappa leather lounge seats, rear passenger massage functions, active ambient lighting, executive footrests.',
        suitableTravelType: 'HNWI VIP Transportation, Luxury Weddings, Ultra-Premium Transfers',
        available: true
    },
    {
        name: 'Honda City',
        brand: 'Honda',
        category: 'sedan',
        fuelType: 'Petrol',
        transmission: 'Automatic',
        seats: 5,
        color: 'Silver',
        pricePerDay: 3500,
        image: './media/vehicles/honda-city.jpg',
        description: 'Reliable and fuel-efficient sedan ideal for city rides, airport transfers, and comfortable family travel.',
        travelUsage: 'Daily executive transit, airport pickups, and comfortable intercity family trips.',
        comfortFeatures: 'Spacious rear legroom, automatic climate control, cruise control, multi-angle rear camera.',
        suitableTravelType: 'Family Outstation Tours, Affordable Business Travel',
        available: true
    },
    {
        name: 'Honda Amaze',
        brand: 'Honda',
        category: 'sedan',
        fuelType: 'Petrol',
        transmission: 'Manual',
        seats: 5,
        color: 'Gold',
        pricePerDay: 2800,
        image: './media/vehicles/honda-amaze.jpg',
        description: 'Practical and comfortable compact sedan suitable for local travel, daily rides, and economical trips.',
        travelUsage: 'Economical city sightseeing, airport runs, and short outstation family trips.',
        comfortFeatures: 'Compact comfortable cabin, high fuel efficiency, automatic climate control, practical luggage boot.',
        suitableTravelType: 'Budget City Tours, Short Outstation Getaways',
        available: true
    },
    {
        name: 'Hyundai Verna',
        brand: 'Hyundai',
        category: 'sedan',
        fuelType: 'Petrol',
        transmission: 'Automatic',
        seats: 5,
        color: 'Black',
        pricePerDay: 3200,
        image: './media/vehicles/hyundai-verna.jpg',
        description: 'Stylish premium sedan with modern interiors, smooth ride quality, and excellent long-distance comfort.',
        travelUsage: 'Premium personal tours, outstation weekend getaways, and corporate sightseeing.',
        comfortFeatures: 'Ventilated front seats, ambient lighting package, smart electric sunroof, premium audio system.',
        suitableTravelType: 'Outstation Family Travel, Premium City Circuits',
        available: true
    },
    // Mini Bus
    {
        name: '40 Seater Bus',
        brand: 'Volvo',
        category: 'mini-bus',
        fuelType: 'Diesel',
        transmission: 'Automatic',
        seats: 40,
        color: 'White',
        pricePerDay: 18000,
        image: './media/vehicles/40-seater-bus.jpg',
        description: 'Spacious and comfortable bus designed for corporate tours, weddings, school trips, and large group transportation.',
        travelUsage: 'Large corporate outings, destination weddings, school/college excursions, and group pilgrimage tours.',
        comfortFeatures: 'High-capacity dual blower AC, fully reclining seats, onboard dynamic TV screen, large under-belly luggage bay.',
        suitableTravelType: 'MICE Corporate Groups, Large Group Tours, Heritage Pilgrimages',
        available: true
    },
    {
        name: 'Toyota Innova',
        brand: 'Toyota',
        category: 'mini-bus',
        fuelType: 'Diesel',
        transmission: 'Manual',
        seats: 7,
        color: 'Maroon',
        pricePerDay: 5500,
        image: './media/vehicles/toyota-innova.jpg',
        description: 'Premium multi-passenger family travel vehicle suitable for airport transfers, family tours, and comfortable long-distance group travel.',
        travelUsage: 'Airport transfers, outstation family tours, small group business transit, city sightseeing tours.',
        comfortFeatures: 'Dual automatic climate control, plush sliding reclining seats, captain seats, high capacity luggage space.',
        suitableTravelType: 'Outstation Family Tours, Group Sightseeing, Corporate Transfers',
        available: true
    },
    // Traveller
    {
        name: 'Traveller',
        brand: 'Force',
        category: 'traveller',
        fuelType: 'Diesel',
        transmission: 'Manual',
        seats: 12,
        color: 'White',
        pricePerDay: 8500,
        image: './media/vehicles/traveller.jpg',
        description: 'Spacious tourist traveller van ideal for group tours, pilgrimage trips, long-distance journeys, and comfortable passenger transport.',
        travelUsage: 'Corporate sightseeing, extended family tours, pilgrimage groups, outstation group travel.',
        comfortFeatures: 'High headroom cabin, push-back reclining seats, dynamic ambient lighting, high capacity AC vents.',
        suitableTravelType: 'Group Heritage Tours, Pilgrimage Journeys, Family Getaways',
        available: true
    },
    {
        name: 'Toyota Fortuner',
        brand: 'Toyota',
        category: 'traveller',
        fuelType: 'Diesel',
        transmission: 'Automatic',
        seats: 7,
        color: 'White',
        pricePerDay: 7500,
        image: './media/vehicles/toyota-fortuner.jpg',
        description: 'Premium SUV designed for luxury road trips, outstation tours, hill travel, and executive family transportation.',
        travelUsage: 'Hill station climbing, rough terrain touring, luxury family road trips, VIP corporate transit.',
        comfortFeatures: 'Premium leather upholstery, dual-zone automatic AC, active noise cancellation, heavy-duty 4x4 suspension.',
        suitableTravelType: 'Hill Station Expeditions, Rough Terrain Travel, High-End Corporate Trips',
        available: true
    }
];

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('Connected to MongoDB for local updates seeding...');

        await Vehicle.deleteMany({});
        console.log('Cleared old vehicles collection.');

        const inserted = await Vehicle.insertMany(vehicles);
        console.log(`Successfully seeded ${inserted.length} premium vehicles with clean local paths into MongoDB.`);
        
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
}

seed();
