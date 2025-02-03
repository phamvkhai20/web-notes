class GoogleAuth {
  constructor() {
    this.accessToken = null;
    this.userInfo = null;
  }

  async signIn() {
    try {
      const result = await chrome.identity.getAuthToken({ interactive: true });
      this.accessToken = result.token;
      return await this.getUserInfo();
    } catch (error) {
      console.error("Auth Error:", error);
      throw error;
    }
  }

  async getUserInfo() {
    if (!this.accessToken) throw new Error("No access token");

    try {
      const response = await fetch(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to get user info");

      this.userInfo = await response.json();
      return this.userInfo;
    } catch (error) {
      console.error("User Info Error:", error);
      throw error;
    }
  }
}
