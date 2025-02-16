import RPi.GPIO as GPIO
import smbus
import os
import glob
import time
import tensorflow
import numpy as np
from collections import deque

# Setup GPIO mode
GPIO.setmode(GPIO.BCM)

# Define the pin numbers
pin_23 = 23
pin_24 = 24

# Setup pins as output
GPIO.setup(pin_23, GPIO.OUT)
GPIO.setup(pin_24, GPIO.OUT)

# Initialize the I2C bus for MPU6050
bus = smbus.SMBus(1)

# MPU6050 Registers and their Addresses
MPU6050_ADDR = 0x68
PWR_MGMT_1 = 0x6B
ACCEL_XOUT_H = 0x3B
ACCEL_YOUT_H = 0x3D
ACCEL_ZOUT_H = 0x3F
GYRO_XOUT_H = 0x43
GYRO_YOUT_H = 0x45
GYRO_ZOUT_H = 0x47

# Wake up the MPU6050 from sleep mode
bus.write_byte_data(MPU6050_ADDR, PWR_MGMT_1, 0)

def read_word_2c(addr):
    high = bus.read_byte_data(MPU6050_ADDR, addr)
    low = bus.read_byte_data(MPU6050_ADDR, addr+1)
    val = (high << 8) + low
    if (val >= 0x8000):
        return -((65535 - val) + 1)
    else:
        return val

def read_accel_data():
    accel_x = read_word_2c(ACCEL_XOUT_H)
    accel_y = read_word_2c(ACCEL_YOUT_H)
    accel_z = read_word_2c(ACCEL_ZOUT_H)
    return accel_x, accel_y, accel_z

def read_gyro_data():
    gyro_x = read_word_2c(GYRO_XOUT_H)
    gyro_y = read_word_2c(GYRO_YOUT_H)
    gyro_z = read_word_2c(GYRO_ZOUT_H)
    return gyro_x, gyro_y, gyro_z

# Temperature sensor setup
os.system('modprobe w1-gpio')
os.system('modprobe w1-therm')

base_dir = '/sys/bus/w1/devices/'
device_folder = glob.glob(base_dir + '28*')[0]
device_file = device_folder + '/w1_slave'

def read_temp_raw():
    f = open(device_file, 'r')
    lines = f.readlines()
    f.close()
    return lines

def read_temp():
    lines = read_temp_raw()
    while lines[0].strip()[-3:] != 'YES':
        time.sleep(0.2)
        lines = read_temp_raw()
    equals_pos = lines[1].find('t=')
    if equals_pos != -1:
        temp_string = lines[1][equals_pos+2:]
        temp_c = float(temp_string) / 1000.0
        temp_f = temp_c * 9.0 / 5.0 + 32.0
        return temp_c, temp_f


try:

    imu_buffer = deque(maxlen=40) 
    model = tensorflow.keras.models.load_model('trained_model.h5')

    while True:
        # Reading temperature
        temp_c, temp_f = read_temp()
        
        # Reading IMU data
        accel_data = read_accel_data()
        gyro_data = read_gyro_data()
        
        # Printing data
        print(f"Temperature: {temp_c}°C / {temp_f}°F")
        print("Accelerometer data: X:{0}, Y:{1}, Z:{2}".format(*accel_data))
        print("Gyroscope data:     X:{0}, Y:{1}, Z:{2}\n".format(*gyro_data))
        
        # Control Peltier based on temperature and activity state
        if temp_f > 95 or state == 0:
            # Temp crosses 95°F or user engages in high activity, pass current one way
            GPIO.output(pin_23, GPIO.HIGH)
            GPIO.output(pin_24, GPIO.LOW)
        elif temp_f < 93:
            # Temp goes below 93°F, pass current in the other direction
            GPIO.output(pin_23, GPIO.LOW)
            GPIO.output(pin_24, GPIO.HIGH)
        else:
            # Temp is between 93°F and 95°F, turn off the Peltiers
            GPIO.output(pin_23, GPIO.LOW)
            GPIO.output(pin_24, GPIO.LOW)

        # Store the new data in the buffer
        imu_buffer.append((*accel_data, *gyro_data))  # Flatten the data tuple

        # Ensure enough data to run the model
        if len(imu_buffer) == 40:
            imu_array = np.array(imu_buffer) 
            imu_array = imu_array.reshape(1, 40, 6) 

            pred = model.predict(imu_array)
            y_pred_class = np.argmax(pred, axis=1)

            if y_pred_class in [0, 2]:
                state = 0 # running
            elif y_pred_class in [1, 4, 5]:
                state = 1 # walking
            else:
                state = 2 # standing
        
        time.sleep(0.05)  # Read data every 0.05 seconds
except KeyboardInterrupt:
    print("Program interrupted. Exiting...")
    # Clean up GPIO on Ctrl+C exit
    GPIO.cleanup()

# Clean up GPIO on normal exit
GPIO.cleanup()