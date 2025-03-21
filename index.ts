import express from "express";
import type { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

const MOCK_TOKENS = [
  {
    "token": "erd1qqqqqqqqqqqqqpgq2qjlpjjr33a4hdl60ll7300apszjm8c9c8rsg5nymf",
    "staking": "erd1qqqqqqqqqqqqqpgq2qjlpjjr33a4hdl60ll7300apszjm8c9c8rsg5nymf",
    "nameProject": "AAVE"
  },
  {
    "token": "erd1qqqqqqqqqqqqqpgq08dhtprrqlv3jnvankzfmnw4gjyuu23jc8rsq9n5tn",
    "staking": "erd1qqqqqqqqqqqqqpgq08dhtprrqlv3jnvankzfmnw4gjyuu23jc8rsq9n5tn",
    "nameProject": "Compound"
  },
  {
    "token": "erd1qqqqqqqqqqqqqpgqmul7urzjexlupmxuztcsjx4nwu6v07g5c8rsug5amm",
    "staking": "erd1qqqqqqqqqqqqqpgqmul7urzjexlupmxuztcsjx4nwu6v07g5c8rsug5amm",
    "nameProject": "USDXMoney"
  }
];

const LOGO = "https://s2.coinmarketcap.com/static/img/coins/200x200/6892.png"

function generateRandomAPY(): number {
  return Math.floor(Math.random() * 13 + 3);
}

function generateRandomTVL(): number {
  return Math.floor(Math.random() * 9900000 + 100000);
}

async function updateStakingData(index: number) {
  try {
    if (index < 0 || index >= MOCK_TOKENS.length) {
      console.error(`Invalid index: ${index}`);
      return;
    }

    const { token, staking, nameProject } = MOCK_TOKENS[index];
    
    // Generate random APY and TVL values
    const formattedAPY = generateRandomAPY();
    const formattedTVL = generateRandomTVL();

    // Log before upsert for debugging
    console.log(`Attempting to upsert ${nameProject} with staking address: ${staking} and token address: ${token}`);

    await prisma.staking.upsert({
      where: { addressStaking: staking },  // Using staking address as the unique identifier
      update: {
        tvl: formattedTVL,
        apy: formattedAPY,
        updatedAt: new Date()
      },
      create: {
        idProtocol: nameProject + "_" + index,
        addressToken: token,
        addressStaking: staking,
        nameToken: "xEGLD",
        nameProject: nameProject,
        chain: "Multiversx Devnet",
        apy: formattedAPY,
        stablecoin: false,
        categories: ["Staking"],
        logo: LOGO,
        tvl: formattedTVL,
      },
    });

    console.log(`Updated staking data for ${nameProject} with APY: ${formattedAPY}% and TVL: $${formattedTVL.toLocaleString()}`);
  } catch (error) {
    console.error(`Error updating staking data for index ${index}:`, error);
    console.error(error);
  }
}

const getStakingData = async (req: Request, res: Response) => {
  try {
    const data = await prisma.staking.findMany();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch staking data" });
  }
};

const getStakingByIdProtocol = async (req: any, res: any) => {
  try {
    const data = await prisma.staking.findMany({
      where: { idProtocol: req.params.idProtocol },
    });

    if (data.length === 0) {
      return res.status(404).json({ error: "Staking data not found" });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch staking data" });
  }
};

const getStakingByAddress = async (req: any, res: any) => {
  try {
    const data = await prisma.staking.findUnique({
      where: { addressStaking: req.params.address },  // Updated to use staking address
    });

    if (!data) {
      return res.status(404).json({ error: "Staking data not found" });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch staking data" });
  }
};

const updateStaking = async (req: Request, res: Response) => {
  try {
    console.log("Starting update of all staking data...");
    console.log(`Found ${MOCK_TOKENS.length} tokens to update`);
    
    const updatePromises = MOCK_TOKENS.map((_, index) => 
      updateStakingData(index)
    );

    await Promise.all(updatePromises);

    const count = await prisma.staking.count();
    console.log(`Database now has ${count} staking records`);

    res.json({ 
      message: "All staking data updated successfully",
      count: count,
      tokens: MOCK_TOKENS.map(token => token.nameProject)
    });
  } catch (error) {
    console.error("Failed to update staking data:", error);
    res.status(500).json({ error: "Failed to update staking data" });
  }
};

app.get("/staking", getStakingData);
app.get("/staking/:idProtocol", getStakingByIdProtocol);
app.get("/staking/address/:address", getStakingByAddress);
app.post("/staking/update", updateStaking);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default app;