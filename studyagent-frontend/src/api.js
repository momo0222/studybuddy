const API_URL = import.meta.env.VITE_API_URL;

export async function getTopics(){
    const res = await fetch(`${API_URL}/api/topics`);
    return res.json();
}

export async function createTopic(name){
    const res = await fetch(`${API_URL}/api/topics`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({name})
    });
    return res.json();
}