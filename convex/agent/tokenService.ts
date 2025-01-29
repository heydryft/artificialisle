export class TokenService {
    private baseUrl = 'https://api.coingecko.com/api/v3';
  
    async getTrendingTokens() {
        console.log('Getting trending tokens');
      try {
        const response = await fetch(`${this.baseUrl}/search/trending`);
        const data = await response.json();
        console.log(data);
        return data.coins.map((coin: any) => ({
          name: coin.item.name,
          symbol: coin.item.symbol,
          price: coin.item.data.price,
          volume24h: coin.item.data.total_volume,
          priceChange24h: coin.item.data.price_change_percentage_24h.usd,
          description: coin.item.data.content?.description || null,
          marketCap: coin.item.data.market_cap
      }));
      } catch (error) {
        console.error('Error fetching trending tokens:', error);
        return [];
      }
    }
  
    async getTokenPrice(tokenId: string) {
      try {
        const response = await fetch(
          `${this.baseUrl}/simple/price?ids=${tokenId}&vs_currencies=usd&include_24hr_vol=true&include_24hr_change=true`
        );
        return await response.json();
      } catch (error) {
        console.error('Error fetching token price:', error);
        return null;
      }
    }
  }