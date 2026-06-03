require('dotenv').config();
const mongoose = require('mongoose');
const Vehicle = require('./models/Vehicle');

// 12 vehicles using user-provided images + traveller.jpg + 40-seater-bus.jpg
const vehicles = [

  // ── SEDAN ────────────────────────────────────────────────────────────────
  {
    name: 'Mercedes E 220d', brand: 'Mercedes', category: 'sedan',
    fuelType: 'Diesel', transmission: 'Automatic', seats: 5, color: 'White',
    pricePerDay: 9500,
    image: './media/vehicles/Mercedes_E_220d.jpg',
    description: 'Luxury chauffeur-driven sedan with premium interiors, smooth highway comfort, and business-class travel experience.',
    travelUsage: 'Executive business transit, VIP transfers, and premium outstation trips.',
    comfortFeatures: 'Panoramic sunroof, dual-zone climate control, premium leather seats, Burmester sound system.',
    suitableTravelType: 'VIP Corporate Sightseeing, Luxury Business Transit',
    available: true
  },
  {
    name: 'Mercedes-Benz S-Class', brand: 'Mercedes-Benz', category: 'sedan',
    fuelType: 'Petrol', transmission: 'Automatic', seats: 5, color: 'Black',
    pricePerDay: 15000,
    image: './media/vehicles/Mercedes_Benz_S-Class.webp',
    description: 'Flagship luxury sedan designed for VIP travel with unmatched comfort, ambient interiors, and elite chauffeur experience.',
    travelUsage: 'VIP state visits, HNWI transport, and ultimate luxury chauffeur drives.',
    comfortFeatures: 'Nappa leather lounge seats, rear massage functions, active ambient lighting, executive footrests.',
    suitableTravelType: 'HNWI VIP Transportation, Luxury Weddings, Ultra-Premium Transfers',
    available: true
  },
  {
    name: 'Audi A6', brand: 'Audi', category: 'sedan',
    fuelType: 'Petrol', transmission: 'Automatic', seats: 5, color: 'White',
    pricePerDay: 9000,
    image: './media/vehicles/Audi_A6.jpg',
    description: 'Elegant luxury sedan with advanced technology, spacious interiors, silent cabin comfort, and executive-class travel.',
    travelUsage: 'Business executive transfers, diplomatic meetings, and smooth highway family travel.',
    comfortFeatures: 'Matrix LED headlamps, virtual cockpit plus, acoustic soundproof glass, electric rear sunshade.',
    suitableTravelType: 'Executive Business Transit, Chauffeur-Driven City Tours',
    available: true
  },
  {
    name: 'MG Cyberster', brand: 'MG', category: 'sedan',
    fuelType: 'Electric', transmission: 'Automatic', seats: 2, color: 'White',
    pricePerDay: 16500,
    image: './media/vehicles/MG_Cyberster.jpg',
    description: 'Futuristic electric sports car with aggressive styling, premium cockpit, high acceleration, and open-top luxury experience.',
    travelUsage: 'Premium city cruises, luxury leisure drives, and open-top experiential touring.',
    comfortFeatures: 'F1-inspired scissor doors, electric folding soft-top roof, premium digital dashboard, Bose audio.',
    suitableTravelType: 'Experiential Leisure, Sports Road Trips, Luxury Shoots',
    available: true
  },
  {
    name: 'Porsche Boxster', brand: 'Porsche', category: 'sedan',
    fuelType: 'Petrol', transmission: 'Automatic', seats: 2, color: 'Silver',
    pricePerDay: 18000,
    image: './media/vehicles/Porsche_Boxster.jpg',
    description: 'Iconic performance roadster offering thrilling driving dynamics, premium interiors, and a high-end touring experience.',
    travelUsage: 'High-end leisure travel, sports touring, and premium outstation weekend road trips.',
    comfortFeatures: 'Mid-engine chassis, premium leather bucket seats, high-fidelity acoustics, active suspension.',
    suitableTravelType: 'Elite Sports Touring, Scenic Mountain Passes, Experiential Road Trips',
    available: true
  },
  {
    name: 'Honda City', brand: 'Honda', category: 'sedan',
    fuelType: 'Petrol', transmission: 'Automatic', seats: 5, color: 'Silver',
    pricePerDay: 3500,
    image: './media/vehicles/Honda_City.jpg',
    description: 'Reliable and fuel-efficient sedan ideal for city rides, airport transfers, and comfortable family travel.',
    travelUsage: 'Daily executive transit, airport pickups, and comfortable intercity family trips.',
    comfortFeatures: 'Spacious rear legroom, automatic climate control, cruise control, multi-angle rear camera.',
    suitableTravelType: 'Family Outstation Tours, Affordable Business Travel',
    available: true
  },
  {
    name: 'Honda Amaze', brand: 'Honda', category: 'sedan',
    fuelType: 'Petrol', transmission: 'Manual', seats: 5, color: 'Gold',
    pricePerDay: 2800,
    image: './media/vehicles/Honda_Amaze.jpg',
    description: 'Practical and comfortable compact sedan suitable for local travel, daily rides, and economical outstation trips.',
    travelUsage: 'Economical city sightseeing, airport runs, and short outstation family trips.',
    comfortFeatures: 'Compact comfortable cabin, high fuel efficiency, automatic climate control, practical luggage boot.',
    suitableTravelType: 'Budget City Tours, Short Outstation Getaways',
    available: true
  },
  {
    name: 'Hyundai Verna', brand: 'Hyundai', category: 'sedan',
    fuelType: 'Petrol', transmission: 'Automatic', seats: 5, color: 'Black',
    pricePerDay: 3200,
    image: './media/vehicles/Hyundai_Verna.jpg',
    description: 'Stylish premium sedan with modern interiors, smooth ride quality, and excellent long-distance comfort.',
    travelUsage: 'Premium personal tours, outstation weekend getaways, and corporate sightseeing.',
    comfortFeatures: 'Ventilated front seats, ambient lighting, smart electric sunroof, premium audio system.',
    suitableTravelType: 'Outstation Family Travel, Premium City Circuits',
    available: true
  },

  // ── MPV ──────────────────────────────────────────────────────────────────
  {
    name: '40 Seater Bus', brand: 'Tata', category: 'mpv',
    fuelType: 'Diesel', transmission: 'Automatic', seats: 40, color: 'White',
    pricePerDay: 18000,
    image: './media/vehicles/40-seater-bus.jpg',
    description: 'Spacious and comfortable bus designed for corporate tours, weddings, school trips, and large group transportation.',
    travelUsage: 'Large corporate outings, destination weddings, school/college excursions, and group pilgrimage tours.',
    comfortFeatures: 'High-capacity dual blower AC, fully reclining seats, onboard dynamic TV screen, large under-belly luggage bay.',
    suitableTravelType: 'MICE Corporate Groups, Large Group Tours, Heritage Pilgrimages',
    available: true
  },
  {
    name: 'Toyota Innova Crysta', brand: 'Toyota', category: 'mpv',
    fuelType: 'Diesel', transmission: 'Manual', seats: 7, color: 'Maroon',
    pricePerDay: 5500,
    image: './media/vehicles/Toyota_Innova.jpg',
    description: 'Premium 7-seater MPV with captain seats, excellent highway comfort, and spacious interiors for family and group travel.',
    travelUsage: 'Airport transfers, outstation family tours, small group business transit, city sightseeing.',
    comfortFeatures: 'Dual zone climate control, push-back captain seats, large luggage space, rear privacy curtains.',
    suitableTravelType: 'Outstation Family Tours, Group Sightseeing, Corporate Transfers',
    available: true
  },
  {
    name: 'Toyota Fortuner', brand: 'Toyota', category: 'mpv',
    fuelType: 'Diesel', transmission: 'Automatic', seats: 7, color: 'White',
    pricePerDay: 7500,
    image: './media/vehicles/Toyota_Fortuner.webp',
    description: 'Premium SUV designed for luxury road trips, hill station travel, outstation tours, and executive family transportation.',
    travelUsage: 'Hill station travel, rough terrain touring, luxury family road trips, VIP corporate transit.',
    comfortFeatures: 'Premium leather upholstery, dual-zone AC, active noise cancellation, heavy-duty 4x4 suspension.',
    suitableTravelType: 'Hill Station Expeditions, Rough Terrain Travel, High-End Corporate Trips',
    available: true
  },

  // ── TRAVELLER ────────────────────────────────────────────────────────────
  {
    name: 'Force Traveller', brand: 'Force', category: 'traveller',
    fuelType: 'Diesel', transmission: 'Manual', seats: 12, color: 'White',
    pricePerDay: 8500,
    image: './media/vehicles/traveller.jpg',
    description: 'Spacious Force Traveller van ideal for large group tours, pilgrimage trips, and long-distance outstation travel.',
    travelUsage: 'Corporate sightseeing, extended family tours, pilgrimage groups, and outstation group travel.',
    comfortFeatures: 'High headroom cabin, push-back reclining seats, ambient lighting, high-capacity AC vents.',
    suitableTravelType: 'Group Heritage Tours, Pilgrimage Journeys, Family Getaways',
    available: true
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB...');
    await Vehicle.deleteMany({});
    console.log('Cleared old vehicles.');
    const inserted = await Vehicle.insertMany(vehicles);
    console.log(`✅ Seeded ${inserted.length} vehicles.`);
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();
