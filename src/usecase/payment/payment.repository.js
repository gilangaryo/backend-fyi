import fetch from "node-fetch";

/**
 * ✅ Fetch Payment Session detail (v2 API)
 */
export const fetchXenditSession = async (session_id) => {
    const url = `https://api.xendit.co/sessions/${session_id}`;

    const res = await fetch(url, {
        headers: {
            "Content-Type": "application/json",
            "x-api-version": "2022-07-31", // Sessions API pakai versi 2022-07-31
            Authorization:
                "Basic " + Buffer.from(process.env.XENDIT_SECRET_KEY + ":").toString("base64"),
        },
    });

    if (!res.ok) {
        const error = await res.text();
        throw new Error(`Failed to fetch Xendit session: ${error}`);
    }

    return res.json();
};

/**
 * ✅ Fetch Payment Status detail (v3 API)
 */
export const fetchXenditPayment = async (payment_id) => {
    const url = `https://api.xendit.co/v3/payments/${payment_id}`;

    const res = await fetch(url, {
        headers: {
            "Content-Type": "application/json",
            "api-version": "2024-11-11", // ⚡ sesuai dokumentasi terbaru
            Authorization:
                "Basic " + Buffer.from(process.env.XENDIT_SECRET_KEY + ":").toString("base64"),
        },
    });

    if (!res.ok) {
        const error = await res.text();
        throw new Error(`Failed to fetch Xendit payment: ${error}`);
    }

    return res.json();
};
