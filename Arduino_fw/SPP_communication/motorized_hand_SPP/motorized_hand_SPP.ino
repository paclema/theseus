#include <Servo.h>

/*-- Example of commmands:

    HAND:125,56,44,144,153;

    Values from 0 to 180

*/

#define HAND_VALUES 5
#define NUMBER_OF_SERVOS 6

Servo servo[NUMBER_OF_SERVOS];
int servo_pos[NUMBER_OF_SERVOS];

String command;

void setup()
{
  //-- Attach the servos. Order for right hand, counting from the thumb to the little finger.
  //-- Servos are connected from digital pin #6 to #10. Servo for wrist is connected at #11 digital pin.
  
  //-- Servo setup
  for (int i=0; i<NUMBER_OF_SERVOS; i++) servo[i].attach(i+6);

  //-- Servo inti position:
  for (int i=0; i<NUMBER_OF_SERVOS; i++){
    servo_pos[i]=90;
    servo[i].write(servo_pos[i]);
    } 

  Serial.begin(19200);
  
}

void loop()
{

    if(Serial.available()){
        char c = Serial.read();

        if(c == '\n'){
          parseCommand(command);
          command = "";
        }
        else command += c;
    }

      for(int i=0; i<NUMBER_OF_SERVOS; i++) servo[i].write(servo_pos[i]);

}

void parseCommand(String com)
{
  String part1;
  String part2;

  part1 = com.substring(0,com.indexOf(":"));
  part2 = com.substring(com.indexOf(":")+1,com.indexOf(";"));

  if(part1.equalsIgnoreCase("HAND"))
  {
    //Serial.print("HAND recognized: ");

    for(int i=0; i<HAND_VALUES; i++){

      servo_pos[i] = part2.substring(0,part2.indexOf(",")).toInt();
      //Serial.print(servo_pos[i]);
      part2 = part2.substring(part2.indexOf(",")+1);
      //Serial.print("\t");
    }

      //Serial.println("_");



    for(int i=0; i<NUMBER_OF_SERVOS; i++) servo[i].write(servo_pos[i]);
  }

  else if(part1.equalsIgnoreCase("FINGER"))
  {

// -------------------- TODO -------------

  }
  else if(part1.equalsIgnoreCase("WRIST"))
  {

    servo_pos[5] = part2.substring(0,part2.indexOf(";")).toInt();
    servo[5].write(servo_pos[5]);    

  }
  else
  {
    Serial.print("Command not recognized");
   // Serial.println(com);

  }  

}

