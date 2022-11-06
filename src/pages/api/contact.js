export const post = async ({ request }) => {
  if (request.headers.get("Content-Type") === "application/json") {
    const formData = await request.json();
    const payload = {
      access_key: import.meta.env.WEB3_FORM_APIKEY,
      ...formData,
    };
    let res;
    try {
      const response = await fetch(import.meta.env.WEB3_FORM_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        console.error(response);
        res = new Response(JSON.stringify(response.status), { status: response.status });
        res.headers.set("Content-type", "text/plain");
      }
      const result = await response.json();
      if (!result.success) {
        console.error(result.message);
        res = new Response(JSON.stringify(result.message), { status: response.status });
        res.headers.set("Content-type", "text/plain");
      }
      res = new Response(JSON.stringify(result), { status: 200 });
    } catch (error) {
      const errorObject = {
        error: error.message,
      };
      res = new Response(JSON.stringify(errorObject), { status: 500 });
      res.headers.set("Content-type", "application/json;charset=UTF-8");
    }
    return res;
  }
  res = new Response("HTTP Method Not Allowed", {
    status: 405,
    statusText: "Method Not Allowed",
    headers: {
      Allow: "GET",
    },
  });
  res.headers.set("Content-type", "text/plain");
  res.headers.set("Allow", "GET");
  return res;
};
