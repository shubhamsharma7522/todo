require('dotenv').config();
const mongoose = require('mongoose');
const Vehicle = require('./models/Vehicle');

const vehicles = [
    // Sports
    {
        name: 'Porsche 718',
        brand: 'Porsche',
        category: 'sports',
        fuelType: 'Petrol',
        transmission: 'Automatic',
        seats: 2,
        color: 'Red',
        pricePerDay: 18000,
        image: '/media/images/vehicle-01.jpg',
        available: true
    },
    {
        name: 'Porsche Red Sports Edition',
        brand: 'Porsche',
        category: 'sports',
        fuelType: 'Petrol',
        transmission: 'Automatic',
        seats: 2,
        color: 'Red',
        pricePerDay: 17500,
        image: '/media/images/vehicle-02.jpg',
        available: true
    },
    {
        name: 'MG Cyberster',
        brand: 'MG',
        category: 'sports',
        fuelType: 'Electric',
        transmission: 'Automatic',
        seats: 2,
        color: 'Silver',
        pricePerDay: 16000,
        image: '/media/images/vehicle-03.jpg',
        available: true
    },
    // Luxury sedans
    {
        name: 'Mercedes Benz E220d',
        brand: 'Mercedes Benz',
        category: 'luxury-sedan',
        fuelType: 'Diesel',
        transmission: 'Automatic',
        seats: 5,
        color: 'Black',
        pricePerDay: 9500,
        image: '/media/images/vehicle-04.jpg',
        available: true
    },
    {
        name: 'Mercedes Benz E Class',
        brand: 'Mercedes Benz',
        category: 'luxury-sedan',
        fuelType: 'Petrol',
        transmission: 'Automatic',
        seats: 5,
        color: 'White',
        pricePerDay: 9800,
        image: '/media/images/vehicle-05.jpg',
        available: true
    },
    {
        name: 'Mercedes Benz S Class',
        brand: 'Mercedes Benz',
        category: 'luxury-sedan',
        fuelType: 'Petrol',
        transmission: 'Automatic',
        seats: 5,
        color: 'Silver',
        pricePerDay: 14000,
        image: '/media/images/vehicle-06.jpg',
        available: true
    },
    {
        name: 'Audi A6 Sedan',
        brand: 'Audi',
        category: 'luxury-sedan',
        fuelType: 'Petrol',
        transmission: 'Automatic',
        seats: 5,
        color: 'Grey',
        pricePerDay: 8500,
        image: '/media/images/vehicle-07.jpg',
        available: true
    },
    // Budget sedans
    {
        name: 'Honda City',
        brand: 'Honda',
        category: 'budget-sedan',
        fuelType: 'Petrol',
        transmission: 'Automatic',
        seats: 5,
        color: 'White',
        pricePerDay: 3800,
        image: '/media/images/vehicle-08.jpg',
        available: true
    },
    {
        name: 'Honda Amaze',
        brand: 'Honda',
        category: 'budget-sedan',
        fuelType: 'Petrol',
        transmission: 'Manual',
        seats: 5,
        color: 'Silver',
        pricePerDay: 3200,
        image: '/media/images/vehicle-09.jpg',
        available: true
    },
    {
        name: 'Hyundai Verna',
        brand: 'Hyundai',
        category: 'budget-sedan',
        fuelType: 'Petrol',
        transmission: 'Automatic',
        seats: 5,
        color: 'Grey',
        pricePerDay: 3600,
        image: '/media/images/vehicle-10.jpg',
        available: true
    },
    {
        name: 'Toyota Corolla',
        brand: 'Toyota',
        category: 'budget-sedan',
        fuelType: 'Petrol',
        transmission: 'Automatic',
        seats: 5,
        color: 'Black',
        pricePerDay: 3400,
        image: '/media/images/vehicle-11.jpg',
        available: true
    },
    {
        name: 'Skoda Slavia',
        brand: 'Skoda',
        category: 'budget-sedan',
        fuelType: 'Petrol',
        transmission: 'Manual',
        seats: 5,
        color: 'Blue',
        pricePerDay: 3500,
        image: '/media/images/vehicle-12.jpg',
        available: true
    },
    // SUV
    {
        name: 'Toyota Fortuner',
        brand: 'Toyota',
        category: 'suv',
        fuelType: 'Diesel',
        transmission: 'Automatic',
        seats: 7,
        color: 'White',
        pricePerDay: 7500,
        image: '/media/images/vehicle-01.jpg',
        available: true
    },
    {
        name: 'Toyota Innova',
        brand: 'Toyota',
        category: 'suv',
        fuelType: 'Diesel',
        transmission: 'Manual',
        seats: 7,
        color: 'Silver',
        pricePerDay: 6200,
        image: '/media/images/vehicle-02.jpg',
        available: true
    },
    {
        name: 'Mahindra XUV700',
        brand: 'Mahindra',
        category: 'suv',
        fuelType: 'Petrol',
        transmission: 'Automatic',
        seats: 7,
        color: 'Blue',
        pricePerDay: 6400,
        image: '/media/images/vehicle-03.jpg',
        available: true
    },
    {
        name: 'Tata Safari',
        brand: 'Tata',
        category: 'suv',
        fuelType: 'Diesel',
        transmission: 'Manual',
        seats: 7,
        color: 'Grey',
        pricePerDay: 6000,
        image: '/media/images/vehicle-04.jpg',
        available: true
    },
    {
        name: 'Hyundai Creta',
        brand: 'Hyundai',
        category: 'suv',
        fuelType: 'Petrol',
        transmission: 'Automatic',
        seats: 5,
        color: 'Red',
        pricePerDay: 5200,
        image: '/media/images/vehicle-05.jpg',
        available: true
    },
    // Bus
    {
        name: 'Volvo Tourist Bus',
        brand: 'Volvo',
        category: 'bus',
        fuelType: 'Diesel',
        transmission: 'Automatic',
        seats: 40,
        color: 'White',
        pricePerDay: 18000,
        image: '/media/images/vehicle-10.jpg',
        available: true
    }
];

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        await Vehicle.deleteMany({});
        await Vehicle.insertMany(vehicles);

        console.log(`Inserted ${vehicles.length} vehicles`);
        process.exit(0);
    } catch (error) {
        console.error('Seed failed', error);
        process.exit(1);
    }
}

seed();
