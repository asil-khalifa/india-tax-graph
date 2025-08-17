import axios from "axios";
import fs from "fs";

const url = "https://cleartax.in/f/itr/tax_calculator_results/";

const lower = 50000;
const upper = 20000000;
const outputFile = "output.txt";

// helper sleep
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// clear the file before writing
fs.writeFileSync(outputFile, "");

async function getData() {
    for (let i = lower; i <= upper; i += 50000) {
        let success = false;

        while (!success) {
            try {
                const resp = await axios.post(
                    url,
                    { Year: "2025", AgeGroup: "NotSenior", TaxableSalary: i },
                    { headers: { "Content-Type": "application/json" } }
                );

                if (resp.status === 200) {
                    const tax = resp.data.newBudgetNewRegime?.grossTax ?? "NA";

                    // write to file
                    fs.appendFileSync(outputFile, `${i} ${tax}\n`);

                    console.log(i, tax);
                    success = true; // move to next i
                } else {
                    console.log("non-200 response", resp.status);
                    await sleep(2000);
                }
            } catch (error) {
                if (error.response?.status === 429) {
                    const retryAfter =
                        parseInt(error.response.headers["retry-after"]) || 2;
                    console.log(
                        `Rate limit hit at ${i}, retrying in ${retryAfter}s`
                    );
                    await sleep(retryAfter * 1000);
                } else {
                    console.log(`error at ${i}`, error.message);
                    return; // stop loop for other errors
                }
            }
        }

        // throttle between requests
        await sleep(500);
    }
}

getData();
