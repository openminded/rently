import duitku from 'duitku';
const { getPaymentMethod } = duitku;
import dotenv from 'dotenv';
dotenv.config();

// Ensure config is loaded as the npm package expects it
import fs from 'fs';
import path from 'path';

async function testMethods() {
    console.log('Fetching Payment Methods...');
    getPaymentMethod(10000, (resp: any, error: any) => {
        if (error) {
            console.error('FAILED TO FETCH METHODS:', error);
        } else {
            console.log('AVAILABLE METHODS:', JSON.stringify(resp, null, 2));
        }
    });
}

testMethods();
