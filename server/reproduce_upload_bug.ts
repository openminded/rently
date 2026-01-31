
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import fetch from 'node-fetch';

const API_URL = 'http://localhost:3000/api';

async function testUpload() {
    // 1. Create an Item first
    console.log("Creating item...");
    const form = new FormData();
    form.append('name', 'Test Item Upload');
    form.append('description', 'Test Description');
    form.append('rentalPrice', '10000');
    form.append('categoryId', '1'); // Assuming 1 exists
    form.append('brandId', '1'); // Assuming 1 exists

    // Upload 1 image
    const imagePath = path.resolve('dummy.png');
    form.append('images', fs.createReadStream(imagePath));

    try {
        const createRes = await fetch(`${API_URL}/items`, {
            method: 'POST',
            body: form
        });
        const createdItem = await createRes.json();
        console.log("Created result:", createdItem);

        if (!createRes.ok) {
            console.error("Failed to create item");
            return;
        }

        const itemId = createdItem.id;

        // 2. Update Item with NEW image
        console.log(`Updating item ${itemId} with new image...`);
        const updateForm = new FormData();
        updateForm.append('name', 'Test Item Upload Updated');
        updateForm.append('description', 'Updated Description');
        updateForm.append('rentalPrice', '15000');
        updateForm.append('categoryId', '1');
        updateForm.append('brandId', '1');

        // Add a new image
        updateForm.append('images', fs.createReadStream(imagePath));

        const updateRes = await fetch(`${API_URL}/items/${itemId}`, {
            method: 'PUT',
            body: updateForm
        });

        const updatedItem = await updateRes.json();
        console.log("Update result:", updatedItem);

        if (!updateRes.ok) {
            console.error("Failed to update item with image");
        } else {
            console.log("Successfully updated item with image!");
        }

    } catch (e) {
        console.error("Error:", e);
    }
}

testUpload();
