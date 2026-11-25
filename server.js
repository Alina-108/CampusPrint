require("dotenv").config();
const express = require("express");
const multer = require("multer");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");


const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("."));

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

/* FILE UPLOAD */

const storage = multer.diskStorage({
    destination: (_, __, cb) => cb(null, "uploads/"),
    filename: (_, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});

const upload = multer({ storage: multer.memoryStorage() });

/* HELPERS */

const updateQueue = orders => {
    let queue = 1;

    orders.forEach(o => {
        if (o.status === "Pending") {
            o.queuePosition = queue;
            o.estimatedTime = queue * 2;
            queue++;
        }
    });
};

const generateOrderId = () => {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const prefix = [...Array(4)]
        .map(() => letters[Math.floor(Math.random() * letters.length)])
        .join("");

    const numbers = Math.floor(100000 + Math.random() * 900000);
    return prefix + numbers;
};

const calculatePrice = (color, copies) =>
    color === "Color" ? copies * 15 : copies * 5;

/* ROUTES */

app.post("/place-order", upload.single("file"), async (req, res) => {
    try {
        const { regno, phone, name, copies, color, payment } = req.body;

        const { data: existingOrders } = await supabase
            .from("orders")
            .select("*")
            .eq("regNo", regno)
            .eq("status", "Pending");

        if (existingOrders && existingOrders.length) {
            return res.json({ error: "You already have a pending order" });
        }

        let fileUrl = "";

        if (req.file) {
            const fileName = `${Date.now()}-${req.file.originalname}`;

            const { error: uploadError } = await supabase.storage
                .from("campusprint-files")
                .upload(`orders/${fileName}`, req.file.buffer, {
                    contentType: req.file.mimetype
                });

            if (uploadError) {
                console.error(uploadError);
                return res.json({ error: "File upload failed" });
            }

           fileUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/campusprint-files/orders/${fileName}`;
        }

        const order = {
            orderId: generateOrderId(),
            name,
            regNo: regno,
            phone,
            copies: +copies,
            color,
            payment,
            price: calculatePrice(color, +copies),
            file: fileUrl,
            status: "Pending",
            time: new Date().toLocaleTimeString(),
            date: new Date().toISOString().split("T")[0]
        };

        await supabase.from("orders").insert([order]);

        const { data: allOrders } = await supabase.from("orders").select("*");

        if (allOrders && Array.isArray(allOrders)) {
            updateQueue(allOrders);

            await Promise.all(
                allOrders.map(o =>
                    supabase
                        .from("orders")
                        .update({
                            queuePosition: o.queuePosition || null,
                            estimatedTime: o.estimatedTime || null
                        })
                        .eq("id", o.id)
                )
            );
        }

        const { data: updatedOrder } = await supabase
            .from("orders")
            .select("*")
            .eq("orderId", order.orderId)
            .single();

        res.json(updatedOrder);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});;

app.get("/orders", async (req, res) => {
    const { data } = await supabase.from("orders").select("*");
    res.json(data);
});

app.post("/order-ready/:id", async (req, res) => {

    const id = req.params.id.trim();
    console.log("Clicked ID:", id);

    const { data: updatedOrder, error } = await supabase
        .from("orders")
        .update({
            status: "Ready for Pickup",
            readyTime: new Date().toLocaleTimeString(),
            queuePosition: null,
            estimatedTime: null
        })
        .eq("orderId", id)
        .select();

    console.log("Updated response:", updatedOrder);
    console.log("Error:", error);

    if (error) {
        return res.json({ error: error.message });
    }

    if (!updatedOrder || updatedOrder.length === 0) {
        return res.json({ error: "Order not found" });
    }

    //  FIXED QUEUE UPDATE 
    const { data: allOrders } = await supabase.from("orders").select("*");

    if (allOrders && Array.isArray(allOrders)) {
        updateQueue(allOrders);

        await Promise.all(
            allOrders.map(o =>
                supabase
                    .from("orders")
                    .update({
                        queuePosition: o.queuePosition || null,
                        estimatedTime: o.estimatedTime || null
                    })
                    .eq("id", o.id)
            )
        );
    }

    const order = updatedOrder[0];

    const message = encodeURIComponent(
        `Hello ${order.name}, your order (${order.orderId}) is ready for pickup.`
    );

    const whatsappLink = `https://wa.me/91${order.phone}?text=${message}`;

    res.json({
        success: true,
        whatsappLink
    });
});

app.get("/track/:id", async (req, res) => {

    const id = req.params.id;

    const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("orderId", id)   
        .single();

    if (error || !data) {
        return res.json({ error: "Order not found" });
    }

    res.json(data);
});
app.get("/last-order/:regno", async (req, res) => {
    try {
        const regno = req.params.regno;

        const { data, error } = await supabase
            .from("orders")
            .select("orderId, status, date")
            .eq("regNo", regno)
            .order("date", { ascending: false })
            .limit(1);

        if (error) {
            console.error("Last order error:", error);
            return res.status(500).json({
                message: "Could not fetch last order"
            });
        }

        if (!data || data.length === 0) {
            return res.json({
                message: "No previous order"
            });
        }

        res.json(data[0]);

    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Server error"
        });
    }
});

app.post("/help", async (req, res) => {

    const { name, email, message } = req.body;

    if (!name || !email || !message) {
        return res.json({ error: "All fields required" });
    }

    const { error } = await supabase
        .from("help_requests")
        .insert([{ name, email, message }]);

    if (error) {
        console.error(error);
        return res.json({ error: "Failed to submit" });
    }

    res.json({ success: true });
});

/* START */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});
