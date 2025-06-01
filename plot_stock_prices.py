import yfinance as yf
import matplotlib.pyplot as plt
import datetime

def plot_stock_prices(tickers, start_date, end_date):
    """
    Plots the adjusted close prices of given tickers for a specified date range.

    Args:
        tickers (list): A list of stock ticker symbols (e.g., ["GOOGL", "AMZN"]).
        start_date (str): The start date in "YYYY-MM-DD" format.
        end_date (str): The end date in "YYYY-MM-DD" format.
    """
    data = yf.download(tickers, start=start_date, end=end_date)
    print(data.columns)

    plt.figure(figsize=(12, 6))
    for ticker in tickers:
        plt.plot(data['Close', ticker], label=ticker)

    plt.title(f'Stock Prices from {start_date} to {end_date}')
    plt.xlabel('Date')
    plt.ylabel('Adjusted Close Price (USD)')
    plt.legend()
    plt.grid(True)
    plt.show()

if __name__ == "__main__":
    # Define tickers and date range for 2024
    stock_tickers = ["GOOGL", "AMZN"]
    start_of_2024 = "2024-01-01"
    end_of_2024 = "2024-12-31"

    plot_stock_prices(stock_tickers, start_of_2024, end_of_2024) 