'use strict';

const { ClothingItem, ClothingImage, Category, User } = require('./models');

const products = [
  {
    title: "Men's Waterproof Puffer Jacket",
    brand: "The North Face",
    category: "Men",
    subcategory: "Jackets",
    description: "Heavy insulated waterproof puffer jacket designed for freezing temperatures, snow, winter travel, and cold outdoor activities.",
    gender: "Men",
    color: "Black",
    condition: "Like New",
    image: "https://images.unsplash.com/photo-1551028719-00167b16eac5"
  },
  {
    title: "Men's Slim Fit Oxford Shirt",
    brand: "H&M",
    category: "Men",
    subcategory: "Shirts",
    description: "Clean slim-fit Oxford shirt suitable for office work, business meetings, formal gatherings, and smart casual outfits.",
    gender: "Men",
    color: "White",
    condition: "New",
    image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf"
  },
  {
    title: "Men's Classic Cotton T-Shirt",
    brand: "Adidas",
    category: "Men",
    subcategory: "T-Shirts",
    description: "Soft cotton crew-neck T-shirt designed for everyday casual wear, gym sessions, travel, and relaxed weekend outfits.",
    gender: "Men",
    color: "Grey",
    condition: "Good",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab"
  },
  {
    title: "Men's Straight Fit Denim Jeans",
    brand: "Levi's",
    category: "Men",
    subcategory: "Jeans",
    description: "Classic straight-fit denim jeans suitable for daily casual wear, shopping, university, weekend outings, and streetwear looks.",
    gender: "Men",
    color: "Dark Blue",
    condition: "Like New",
    image: "https://images.unsplash.com/photo-1542272604-787c3835535d"
  },
  {
    title: "Men's Relaxed Fit Cargo Trousers",
    brand: "Zara",
    category: "Men",
    subcategory: "Trousers",
    description: "Relaxed cargo trousers with practical pockets, ideal for outdoor activities, travel, casual outings, and comfortable everyday wear.",
    gender: "Men",
    color: "Olive",
    condition: "Good",
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f"
  },
  {
    title: "Men's Merino Wool Sweater",
    brand: "Uniqlo",
    category: "Men",
    subcategory: "Sweaters",
    description: "Soft merino wool sweater providing warmth during cold weather, suitable for office layering, winter travel, and smart casual outfits.",
    gender: "Men",
    color: "Navy",
    condition: "Like New",
    image: "https://images.unsplash.com/photo-1610652492500-ded49ceeb378"
  },
  {
    title: "Men's Embroidered Kurta",
    brand: "Khaadi",
    category: "Men",
    subcategory: "Kurtas",
    description: "Traditional cotton kurta featuring subtle embroidery, suitable for Eid, family gatherings, cultural celebrations, and festive occasions.",
    gender: "Men",
    color: "Cream",
    condition: "New",
    image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35"
  },
  {
    title: "Women's Floral Summer Dress",
    brand: "Zara",
    category: "Women",
    subcategory: "Dresses",
    description: "Lightweight floral summer dress made from breathable fabric, perfect for beach trips, picnics, vacations, and warm-weather outings.",
    gender: "Women",
    color: "Yellow",
    condition: "New",
    image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8"
  },
  {
    title: "Women's Embroidered Cotton Kurta",
    brand: "Khaadi",
    category: "Women",
    subcategory: "Kurtas",
    description: "Lightweight cotton kurta with traditional embroidery, designed for Eid celebrations, family gatherings, cultural events, and festive occasions.",
    gender: "Women",
    color: "Maroon",
    condition: "New",
    image: "https://images.unsplash.com/photo-1583391733956-6c78276477e2"
  },
  {
    title: "Women's Oversized Denim Jacket",
    brand: "Levi's",
    category: "Women",
    subcategory: "Jackets",
    description: "Relaxed oversized denim jacket suitable for casual outfits, university, shopping, travel, and everyday layering.",
    gender: "Women",
    color: "Blue",
    condition: "Like New",
    image: "https://images.unsplash.com/photo-1543076447-215ad9ba6923"
  },
  {
    title: "Women's Ribbed Knit Sweater",
    brand: "Mango",
    category: "Women",
    subcategory: "Sweaters",
    description: "Soft ribbed knit sweater designed for chilly weather, winter layering, casual outings, and comfortable everyday outfits.",
    gender: "Women",
    color: "Beige",
    condition: "Good",
    image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27"
  },
  {
    title: "Women's Linen Button-Up Shirt",
    brand: "H&M",
    category: "Women",
    subcategory: "Shirts",
    description: "Breathable linen shirt with a relaxed fit, ideal for summer weather, vacations, beach walks, and casual daytime outfits.",
    gender: "Women",
    color: "White",
    condition: "Like New",
    image: "https://images.unsplash.com/photo-1603252110481-7ba873bf42ab"
  },
  {
    title: "Women's High Rise Skinny Jeans",
    brand: "Guess",
    category: "Women",
    subcategory: "Jeans",
    description: "High-rise stretch denim jeans designed for casual outings, shopping, everyday wear, and modern street-style outfits.",
    gender: "Women",
    color: "Black",
    condition: "Good",
    image: "https://images.unsplash.com/photo-1542272604-787c3835535d"
  },
  {
    title: "Women's Fleece Pullover Hoodie",
    brand: "Nike",
    category: "Women",
    subcategory: "Hoodies",
    description: "Soft fleece hoodie with a relaxed fit and warm interior, suitable for casual days, travel, workouts, and cool weather.",
    gender: "Women",
    color: "Cream",
    condition: "New",
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7"
  },
  {
    title: "Classic Oversized Fleece Hoodie",
    brand: "Nike",
    category: "Unisex",
    subcategory: "Hoodies",
    description: "Oversized fleece hoodie designed for comfortable everyday wear, casual outings, travel, lounging, and cool weather.",
    gender: "Unisex",
    color: "Black",
    condition: "Like New",
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7"
  },
  {
    title: "Unisex Classic Cotton T-Shirt",
    brand: "Adidas",
    category: "Unisex",
    subcategory: "T-Shirts",
    description: "Simple cotton crew-neck T-shirt with a relaxed fit, suitable for everyday casual outfits, sports, travel, and outdoor activities.",
    gender: "Unisex",
    color: "White",
    condition: "New",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab"
  },
  {
    title: "Unisex Lightweight Windbreaker",
    brand: "Puma",
    category: "Unisex",
    subcategory: "Jackets",
    description: "Lightweight wind-resistant jacket suitable for running, cycling, travel, outdoor walks, and changing weather conditions.",
    gender: "Unisex",
    color: "Green",
    condition: "Good",
    image: "https://images.unsplash.com/photo-1544966503-7cc5ac882d5f"
  },
  {
    title: "Unisex Relaxed Fit Jeans",
    brand: "Levi's",
    category: "Unisex",
    subcategory: "Jeans",
    description: "Relaxed-fit denim jeans designed for comfortable everyday wear, casual streetwear, travel, and weekend activities.",
    gender: "Unisex",
    color: "Blue",
    condition: "Like New",
    image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246"
  },
  {
    title: "Unisex Heavyweight Knit Sweater",
    brand: "Uniqlo",
    category: "Unisex",
    subcategory: "Sweaters",
    description: "Heavyweight knitted sweater designed to provide warmth during cold days, winter travel, outdoor walks, and casual gatherings.",
    gender: "Unisex",
    color: "Charcoal",
    condition: "Good",
    image: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633"
  },
  {
    title: "Unisex Relaxed Cargo Trousers",
    brand: "Carhartt",
    category: "Unisex",
    subcategory: "Trousers",
    description: "Durable relaxed-fit cargo trousers with multiple pockets, suitable for travel, outdoor activities, casual work, and everyday wear.",
    gender: "Unisex",
    color: "Khaki",
    condition: "Like New",
    image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80"
  }
];

const mapGender = (g) => {
  const lower = g.toLowerCase();
  if (lower === 'men' || lower === 'male') return 'male';
  if (lower === 'women' || lower === 'female') return 'female';
  return 'unisex';
};

const mapCondition = (c) => {
  const lower = c.toLowerCase();
  if (lower === 'new') return 'new';
  if (lower === 'like new' || lower === 'like_new') return 'like_new';
  if (lower === 'good') return 'good';
  return 'fair';
};

async function seed() {
  try {
    const defaultUser = await User.findOne();
    if (!defaultUser) {
      console.error('No user found in database!');
      process.exit(1);
    }

    const categories = await Category.findAll();
    const catMap = new Map();
    categories.forEach(c => catMap.set(c.name.toLowerCase(), c.id));

    let createdCount = 0;

    for (const p of products) {
      let catId = catMap.get(p.subcategory.toLowerCase()) || catMap.get(p.category.toLowerCase()) || categories[0]?.id;

      const item = await ClothingItem.create({
        userId: defaultUser.id,
        categoryId: catId,
        title: p.title,
        description: p.description,
        brand: p.brand,
        size: 'M',
        gender: mapGender(p.gender),
        condition: mapCondition(p.condition),
        color: p.color,
        location: 'Islamabad',
        isAvailable: true,
      });

      if (p.image) {
        await ClothingImage.create({
          itemId: item.id,
          url: p.image,
          isPrimary: true,
          orderIndex: 0,
        });
      }
      createdCount++;
    }

    console.log(`Successfully added all ${createdCount} products to the database!`);
    process.exit(0);
  } catch (err) {
    console.error('Failed to add products:', err);
    process.exit(1);
  }
}

seed();
