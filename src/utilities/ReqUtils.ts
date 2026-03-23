const API_BASE_URL = process.env.EXPO_PUBLIC_LIVE_API_URL

class RequestUtils {

  // GET REQUEST
  static async get(url: string, accessToken?: string): Promise<any | null> {
    try {
      const response = await fetch(API_BASE_URL + url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });

      let res = await response.json();
      console.log("get request response: ", res);

      return res;

    } catch (error: Error | any) {
      throw new Error(`NetworkError on get request: ${error}`);
    }
  };

  // POST REQUEST
  static async post(url: string, accessToken?: string, body: any = {},): Promise<any | null> {
    console.log("url: ", API_BASE_URL + url);
    try {
      const headers: any = {
        Authorization: `Bearer ${accessToken}`,
      };

      let requestBody: BodyInit;

      // Only set Content-Type and stringify if not FormData
      if (!(body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
        requestBody = JSON.stringify(body);
      } else {
        // For FormData, let the browser set the correct boundary
        delete headers['Content-Type'];
        requestBody = body;
      }

      console.log('Request headers:', headers);
      console.log('Request body type:', body instanceof FormData ? 'FormData' : 'JSON');

      const response = await fetch(API_BASE_URL + url, {
        method: 'POST',
        headers,
        body: requestBody,
      });

      let res = await response.json();
      console.log("post request response: ", res);

      return res;

    } catch (error: Error | any) {
      console.error('Network error:', error);
      throw new Error(`NetworkError on post request: ${error}`);
    }
  };

  // PUT REQUEST
  static async put(url: string, accessToken?: string, body = {}): Promise<any | null> {
    try {
      const response = await fetch(API_BASE_URL + url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      });

      let res = await response.json();
      console.log("put request response: ", res);

      return res;

    } catch (error: Error | any) {
      throw new Error(`NetworkError on put request: ${error}`);
    }
  };

  // DELETE REQUEST
  static async delete(url: string, accessToken?: string, body = {}): Promise<any | null> {
    try {
      const response = await fetch(API_BASE_URL + url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      });

      let res = await response.json();
      console.log("delete request response: ", res);

      return res;

    } catch (error: Error | any) {
      throw new Error(`NetworkError on delete request: ${error}`);
    }
  };

  // POST REQUEST WITH FORM DATA
  static async postWithFormData(url: string, accessToken: string, formData: FormData): Promise<any | null> {
    console.log("url: ", API_BASE_URL + url);
    try {
      const headers: any = {
        Authorization: `Bearer ${accessToken}`,
      };

      console.log('Request headers:', headers);
      console.log('Request body type: FormData');

      const response = await fetch(API_BASE_URL + url, {
        method: 'POST',
        headers,
        body: formData,
      });

      let res = await response.json();
      console.log("postWithFormData request response: ", res);

      return res;

    } catch (error: Error | any) {
      console.error('Network error:', error);
      throw new Error(`NetworkError on postWithFormData request: ${error}`);
    }
  };

  static async putWithFormData(url: string, accessToken: string, formData: FormData): Promise<any | null> {
    console.log("url: ", API_BASE_URL + url);
    try {
      const headers: any = {
        Authorization: `Bearer ${accessToken}`,
      };

      console.log('Request headers:', headers);
      console.log('Request body type: FormData');

      const response = await fetch(API_BASE_URL + url, {
        method: 'PUT',
        headers,
        body: formData,
      });

      let res = await response.json();
      console.log("putWithFormData request response: ", res);

      return res;

    } catch (error: Error | any) {
      console.error('Network error:', error);
      throw new Error(`NetworkError on putWithFormData request: ${error}`);
    }
  };

}

export default RequestUtils;
