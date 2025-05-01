# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set the working directory in the container
WORKDIR /app

# Install system dependencies if needed
# RUN apt-get update && apt-get install -y --no-install-recommends build-essential && rm -rf /var/lib/apt/lists/*

# Copy only the requirements file first to leverage Docker cache
# Source path is relative to the build context (project root)
COPY webapp/requirements.txt /app/

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend application code
# Source path is relative to the build context (project root)
COPY webapp/ /app/

# Copy the initialization script (adjust path if necessary)
COPY webapp/scripts/init_app.py /app/scripts/init_app.py

# Expose the port the app runs on
EXPOSE 8000

# Define the command to run the application (will be overridden by backend-init service)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"] 