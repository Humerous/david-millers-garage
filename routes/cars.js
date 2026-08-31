const crypto = require('crypto');
const router = require('express').Router();
const Car = require('../models/cars.model');

const demoCars = [
  {
    _id: "demo-aston-martin",
    owner: "Demo Owner",
    model: "Vantage",
    make: "Aston Martin",
    color: "Forrest Green",
    registration_Number: "DEMO-001",
  },
  {
    _id: "demo-ferrari",
    owner: "Demo Owner",
    model: "La Ferrari",
    make: "Ferrari",
    color: "Red",
    registration_Number: "DEMO-002",
  },
  {
    _id: "demo-porsche",
    owner: "Demo Owner",
    model: "911 targa",
    make: "Porsche",
    color: "Maroon",
    registration_Number: "DEMO-003",
  },
  {
    _id: "demo-ford",
    owner: "Demo Owner",
    model: "GT40",
    make: "Ford",
    color: "White",
    registration_Number: "DEMO-004",
  },
];

let memoryCars = demoCars.map((car) => ({ ...car }));

function isMemoryMode() {
  return (process.env.DATA_MODE || (process.env.ATLAS_MONGO_URI ? 'mongo' : 'memory')) !== 'mongo';
}

function cleanCarInput(body = {}) {
  const fields = ['owner', 'model', 'make', 'color', 'registration_Number'];
  const car = {};

  for (const field of fields) {
    car[field] = typeof body[field] === 'string' ? body[field].trim() : '';
  }

  return car;
}

function validateCar(car) {
  const missing = Object.entries(car)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length) {
    return `Missing required fields: ${missing.join(', ')}`;
  }

  return null;
}

router.get('/', async (req, res) => {
  try {
    if (isMemoryMode()) {
      return res.json(memoryCars);
    }

    const cars = await Car.find().sort({ createdAt: -1 });
    return res.json(cars);
  } catch (error) {
    return res.status(500).json({ error: 'Unable to load cars.' });
  }
});

router.post('/add', async (req, res) => {
  const carInput = cleanCarInput(req.body);
  const validationError = validateCar(carInput);

  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  try {
    if (isMemoryMode()) {
      const car = { _id: crypto.randomUUID(), ...carInput };
      memoryCars = [car, ...memoryCars];
      return res.status(201).json(car);
    }

    const car = await Car.create(carInput);
    return res.status(201).json(car);
  } catch (error) {
    return res.status(400).json({ error: 'Unable to add car.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    if (isMemoryMode()) {
      const car = memoryCars.find((item) => item._id === req.params.id);
      return car ? res.json(car) : res.status(404).json({ error: 'Car not found.' });
    }

    const car = await Car.findById(req.params.id);
    return car ? res.json(car) : res.status(404).json({ error: 'Car not found.' });
  } catch (error) {
    return res.status(400).json({ error: 'Unable to load car.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    if (isMemoryMode()) {
      const before = memoryCars.length;
      memoryCars = memoryCars.filter((item) => item._id !== req.params.id);

      if (memoryCars.length === before) {
        return res.status(404).json({ error: 'Car not found.' });
      }

      return res.json({ message: 'Car deleted.' });
    }

    const car = await Car.findByIdAndDelete(req.params.id);
    return car ? res.json({ message: 'Car deleted.' }) : res.status(404).json({ error: 'Car not found.' });
  } catch (error) {
    return res.status(400).json({ error: 'Unable to delete car.' });
  }
});

router.post('/update/:id', async (req, res) => {
  const carInput = cleanCarInput(req.body);
  const validationError = validateCar(carInput);

  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  try {
    if (isMemoryMode()) {
      const index = memoryCars.findIndex((item) => item._id === req.params.id);

      if (index === -1) {
        return res.status(404).json({ error: 'Car not found.' });
      }

      memoryCars[index] = { ...memoryCars[index], ...carInput };
      return res.json(memoryCars[index]);
    }

    const car = await Car.findByIdAndUpdate(req.params.id, carInput, {
      new: true,
      runValidators: true,
    });

    return car ? res.json(car) : res.status(404).json({ error: 'Car not found.' });
  } catch (error) {
    return res.status(400).json({ error: 'Unable to update car.' });
  }
});

module.exports = router;
