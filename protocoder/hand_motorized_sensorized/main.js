/* hand_controller

Read from arduino by bluetooth diferent sensors and plot it on phone. Then connect to another arduino by bluetooth to send data processend on protocoder app

by Pablo Clemente (aka paclema)
check it at: https://github.com/bq/theseus

    
*/

// UI setup:

ui.backgroundColor(100, 100, 170);
ui.screenMode("portrait");
ui.screenMode("immersive");
ui.allowScroll(true);

// Main variables:

var sensor_raw = [];
var sensor_plot = [];
var sensor_plot_draw = [];
var actuator_data = [];

var data_string = "";

// Max/min ends:

var sensor_raw_min = [ 600, 600, 600, 600, 600];
var sensor_raw_max = [ 800, 800, 800, 800, 800];

var actuator_min = [ 160, 40, 140, 20, 40];
var actuator_max = [ 0, 140, 20, 140, 180];
var actuator_dir = [ 0, 1, 0, 1, 1];

// Enviroment variables:

var Sensors_detected = false;
var display_sensors_offline = true;
var calibrate_sensors = false;

var Offline_interval = 1000;
//*****************************************************************************************   Bluetooth conections:
 

//HAND:

var btClient1;
ui.addCheckbox("Hand connected",  1.75*ui.screenWidth/3 , 0, 500, 100, false).onChange(function(val) { 
    console.log("Hand connecting... ");

    if(val){
        btClient1=network.bluetooth.connectSerial('98:D3:31:B2:DC:26', function(status) {
            console.log("btClient1 connected  " + status);
    
            if (status) media.playSound("Hand_connected.wav");               //media.textToSpeech("Mano conectada");
            
        });
    }
    
    if(!val){
        if(btClient1){
            btClient1.disconnect();
            media.playSound("Hand_disconnected.wav"); 
        } 
    }
    
    btClient1.onNewData(function(data) {
        txt5.text("Actuator received data: " + data + "\n");
        console.log("Actuator received data:" + data);
    });
});

//FLEXIGLOVE:

var btClient2;
var btClient2_data;
ui.addCheckbox("Flexiglobe connected", 1.75*ui.screenWidth/3 , 70, 500, 100, false).onChange(function(val) { 
    console.log("FlexiGlove connecting... ");
    
    if(val){
        btClient2=network.bluetooth.connectSerial('98:D3:31:30:1A:8C', function(status) {
            console.log("btClient2 connected  " + status);
            
            if (status) media.playSound("Sensors_connected.wav");               //media.textToSpeech("Sensores conectados");
            Sensors_detected = true;
        });
        
    }
    
    if(!val){
        if(btClient2){
            btClient2.disconnect();
            Sensors_detected = false;
            media.playSound("Sensors_disconnected.wav"); 
        } 
    }
    
    btClient2.onNewData(function(data) {
        
        txt.text("Raw sensors: " + "\t" + data + "\n");
        
        //Read data values form sensors and stores on sensor_raw array:
        // Example of raw data: HAND:758,567,744,844,753;
        
        data=data.split(";");                           //we don't need the final ";" of the protocol
        var data_part1 = data[0].split(":");            //We take HAND:758,567,744,844,753
                                                        //Now data_part1[0] = HAND  and data_part1[1] = 758,567,744,844,753
        
        if( data_part1[0] == "HAND"){
            var data_part2 = data_part1[1].split(",");  //Now data_part2 is data_part1[1] splitted
            for(var i=0;i<data_part2.length;i++) sensor_raw[i] = data_part2[i];
        }
        
        if(!calibrate_sensors){
            update_raw_sensors_data();
        }
        else if(calibrate_sensors)      update_sensors_ends();
        
        Sensors_detected = true;
        
    });
});


//*****************************************************************************************   Buttons:
var margin_layout = 10 ;
var input = ui.addInput("command", 0, margin_layout, ui.screenWidth/3, ui.screenHeight/10);
var send = ui.addButton("Send", ui.screenWidth/3, margin_layout).onClick(function() {
    btClient1.send(input.getText() + "\n");
});


var send_OPEN = ui.addButton("WRIST:60;", 0, ui.screenHeight*0.12).onClick(function() {
    //btClient1.send("ALL 50" + "\n");
    //btClient1.send("140,40,140,40,40" + "\n");
    btClient1.send("WRIST:60;" + "\n");
    
});
var send_CLOSED = ui.addButton("WRIST:120;", ui.screenWidth/3, ui.screenHeight*0.12).onClick(function() {
    //btClient1.send("ALL -50" + "\n");
    //btClient1.send("40,140,40,140,140" + "\n");
    btClient1.send("WRIST:120;" + "\n");  
  
});
var send_thumbUp = ui.addButton("Trolleo", 2*ui.screenWidth/3 + margin_layout/2, ui.screenHeight*0.12).onClick(function() {
    if(btClient1){
        btClient1.send("WRIST:60;" + "\n");
        util.delay(500, function() {
            btClient1.send("HAND:140,40,140,40,40;" + "\n");
            util.delay(500, function() {
                btClient1.send("HAND:40,140,40,140,140;" + "\n");
                util.delay(500, function() {
                    btClient1.send("WRIST:120;" + "\n");
                    util.delay(1000, function() {
                        btClient1.send("HAND:40,140,140,140,140;" + "\n");
                    });
                });
            });
        });
    }
});



//*****************************************************************************************   Plot Processing:
var processing_heigth = ui.screenWidth*0.74;
var processing = ui.addProcessing(margin_layout,  ui.screenHeight*0.20, ui.screenWidth-20, processing_heigth, "P3D");

var plot_min = 0;
var plot_max = processing_heigth-100;

processing.setup(function(p) {
    p.background(1); 
    p.frameRate(25);
});

processing.draw(function(p) { 
    
    var cnt = 0;
    
    p.fill(0, 20);
    p.rect(0, 0, p.width, p.height);
    p.noStroke();
    p.fill(255);
    

    if(Sensors_detected){
        for(cnt=0;cnt<5;cnt++){
            p.fill(2*sensor_plot_draw[cnt],0,255-2*sensor_plot_draw[cnt]);
            p.rect(0+cnt*ui.screenWidth/5,   p.height,  ui.screenWidth/5 -10 , -sensor_plot_draw[cnt]);
        }
    }
    else if(display_sensors_offline && !Sensors_detected){
        
        p.fill(255,120,42);
        p.textSize(ui.screenWidth/9);    
        p.text("Sensors offline!",80,400);
    
    }
    if(calibrate_sensors){
        for(cnt=0;cnt<5;cnt++){
            p.fill(2*sensor_plot_draw[cnt],0,255-2*sensor_plot_draw[cnt]);
            p.rect(0+cnt*ui.screenWidth/5,   p.height,  ui.screenWidth/5 -10 , processing_heigth/2 -sensor_plot_draw[cnt]);
        }
            
        p.fill(255,120,42);
        p.textSize(ui.screenWidth/9);    
        p.text("Calibrating sensors...",80,400);
    }
    
    // Plot Max/min ends on drawing:

    for(cnt=0;cnt<5;cnt++){
        
        p.fill(150);
        p.textSize(ui.screenWidth/16);     
        p.text(sensor_raw_max[cnt].toFixed(0),20+cnt*ui.screenWidth/5, 50);
        p.text(sensor_raw_min[cnt].toFixed(0),20+cnt*ui.screenWidth/5, processing_heigth-20);
        //p.rect(0+cnt*ui.screenWidth/5,   p.height,  ui.screenWidth/5 -10 , -sensor_plot_draw[cnt]);
        
    }

});

//*****************************************************************************************   Texts:

var txt = ui.addText(margin_layout, ui.screenHeight*0.65, ui.screenWidth, ui.screenHeight*0.04);
var txt2 = ui.addText(margin_layout, ui.screenHeight*0.67, ui.screenWidth, ui.screenHeight*0.04);
var txt3 = ui.addText(margin_layout, ui.screenHeight*0.69, ui.screenWidth, ui.screenHeight*0.04);
var txt4 = ui.addText(margin_layout, ui.screenHeight*0.71, ui.screenWidth, ui.screenHeight*0.04);
var txt5 = ui.addText(margin_layout, ui.screenHeight*0.73, ui.screenWidth, ui.screenHeight*0.04);

//*****************************************************************************************   Functions:

function update_raw_sensors_data(){
    
    var cnt = 0;
    var sensor_raw_updated = [];
    
    // Save raw data to and intermediate array:
    for(cnt=0; cnt<sensor_raw.length; cnt++){
        sensor_raw_updated[cnt] = sensor_raw[cnt];
    } 
    
    // ParseInt raw data and copy to draw variables for processing plot:
    for(cnt=0; cnt<sensor_raw_updated.length; cnt++){
        sensor_raw_updated[cnt] = parseInt(sensor_raw_updated[cnt]);
        sensor_plot[cnt] = sensor_raw_updated[cnt];
    } 
    

    // Map raw data to min/max actuator ends and fix to integer data:
    for(cnt=0; cnt<sensor_raw_updated.length; cnt++){
        if(actuator_dir[cnt])         sensor_raw_updated[cnt] = map( sensor_raw_updated[cnt], sensor_raw_min[cnt], sensor_raw_max[cnt], actuator_min[cnt], actuator_max[cnt]);      //Normal actuator direcction
        else if(!actuator_dir[cnt])   sensor_raw_updated[cnt] = map( sensor_raw_updated[cnt], sensor_raw_max[cnt], sensor_raw_min[cnt], actuator_max[cnt], actuator_min[cnt]);      //Reversed actuator direction
        
        sensor_raw_updated[cnt] = sensor_raw_updated[cnt].toFixed(0);
        
    } 
    
    
    // Map plot data to min/max plot ends and fix to integer data:
    for(cnt=0; cnt<sensor_raw_updated.length; cnt++){
        sensor_plot[cnt] = map( sensor_plot[cnt], sensor_raw_min[cnt], sensor_raw_max[cnt], plot_min, plot_max);
        sensor_plot[cnt] = sensor_plot[cnt].toFixed(0);
        
    }
    
    
    // Copy sensor_plot data to sensor_plot_draw data because of misbehaviour on processing plot:
    for(cnt=0; cnt<sensor_raw_updated.length; cnt++)  sensor_plot_draw[cnt] = sensor_plot[cnt];

    

    // Copy processed data to actuator data array actuator_data with SPP:
    actuator_data.length = 0;               //To empty actuator_data
    actuator_data.push("HAND:");
    for(cnt=0; cnt<sensor_raw_updated.length; cnt++){
        actuator_data.push(sensor_raw_updated[cnt]);
        if(cnt != 4) actuator_data.push(",");
    }
    actuator_data.push(";");
    
    // Convert actuator_data array of integers to and string data_string to send to bluetooth:
    data_string = "";
    for(cnt=0; cnt<actuator_data.length; cnt++)  data_string += actuator_data[cnt];
    
    // Send data_string to the actuator bluetooth
    if(btClient1) btClient1.send(data_string + "\n");

    // DEBUG text:
    txt2.text("Actuators:     " + "\t" + sensor_raw_updated + "\n");
    txt3.text("actuator_data: " + "\t" + actuator_data[0] + actuator_data[1] + actuator_data[2] + actuator_data[3] + actuator_data[4] + actuator_data[5] + actuator_data[6] + actuator_data[7] + actuator_data[8] + actuator_data[9] + ";\n" );   
    //txt4.text("sensor_plot: " + "\t" + sensor_plot + "\n"); 
    txt4.text("data_string:   " + "\t" + data_string + "\n");
  
    
}

function  read_hand_signs(){
    
    var state_margin = 50;
    var fingers_down = read_all_sensor_down(0);
    
    if ((sensor_raw[0] <= sensor_raw_min[0]+state_margin) && (read_all_sensor_down(0) == sensor_raw.length-1)){
        //-- Thumbs up:
        //media.textToSpeech("zams ap!");
        l2.stop();
        media.playSound("dadle_thumbs_up.mp3");  
        console.log("--------------------------thums up");
        util.delay(1000, function() {
        });
        
        l2.start();
        
    }
    else{
        //console.log(fingers_down);
    }

    if ((sensor_raw[2] <= sensor_raw_min[2]+state_margin) && (read_all_sensor_down(2) == sensor_raw.length-1)){
        //-- Thumbs up:
        //media.textToSpeech("fak yu");
        l2.stop();
        media.playSound("fuck_you.mp3");  
        console.log("--------------------------fuck you");
        
        util.delay(1000, function() {
        });
        
        l2.start();
        
    }
    else{
        //console.log(fingers_down);
    }

}

function  read_all_sensor_down(except_finger){
    var down_fingers = 0;
    var state_margin = 50;
    //console.log("---------------------------------------------------------------");
    for(var cnt=0; cnt<sensor_raw.length; cnt++){
        if(cnt!=except_finger){
            if(sensor_raw[cnt] >= sensor_raw_max[cnt]-state_margin){
                //console.log("finger down detected: " + cnt);
                down_fingers++;
            }
            
            
        }
        //console.log("finger detected: " + cnt+ " sensor_raw_max[cnt]: " + sensor_raw[cnt]);
    }
    return down_fingers;
}

function  map( sensor_val,  in_min,  in_max,  out_min,  out_max){
    // in_min start of range
    // in_max end of range
    // sensor_val the starting number between the range
    var percentage = (sensor_val-in_min)/(in_max-in_min);
    var out = (out_max-out_min)*percentage+out_min;
    // out_min start of new range
    // out_max end of new range
       
    return out;
}

//*****************************************************************************************   Sliders:

    //  ******** ------------ TODO --------------------
    
//Add a seekbar
/*
var slider = ui.addSlider(ui.screenWidth - 510, ui.screenHeight - 300, 500, 100, 40, 140).onChange(function(val) {
    if(btClient1) btClient1.send("FINGER:2," + val + ";" + "\n");
});
*/
//*****************************************************************************************   Timers:

// Loop for display "Sensors offline!!" on processing plot:
var loop1;

if(!Sensors_detected){
    loop1 = util.loop(Offline_interval, function () { 
    if(display_sensors_offline) display_sensors_offline = false;
    else display_sensors_offline = true;
    }).start();
}
else if(Sensors_detected){
    //this is how you stop a looper 
    loop1.stop();
    display_sensors_offline = false;
}

var l2 = util.loop(1000, function () { 
    //txt.append("repeating every 1000 ms \n");
    read_hand_signs();
}).start(); 

//*****************************************************************************************   Calibrate:

//  ******** ------------ TODO --------------------

ui.addButton("Calibrar", ui.screenWidth - 410, ui.screenHeight - 200).onClick(function() {
    if(Sensors_detected){
        ui.popupInfo("Calibrate", "Press yes if you want to recalibrate Max/min ends of your FlexiGlobe", "yes", "no", function(reply) {
            calibrate_sensors = reply;
            console.log("you pressed " + reply);
            
            if(calibrate_sensors){
                
                // Restart max/min ends:
                
                sensor_raw_min = [ 700, 700, 700, 700, 700];
                sensor_raw_max = [ 700, 700, 700, 700, 700];
            }
            
            else{
                
                var data = new Array();
                
                for(cnt=0; cnt<sensor_raw_max.length; cnt++)    data.push(sensor_raw_max[cnt]);
                
                //saving data in saved_data.txt 
                fileio.saveStrings("saved_data.txt", data);
            }
        });
    }
    else if(!Sensors_detected){
        /*
        // livecodingfeedback:
        
        var l = app.liveCodingFeedback()
            .autoHide(true)
            .textSize(25)
            .write("Sensors_not_detected!!" + "\n" + "Please connect sensors before calibrating them")
            .backgroundColor("#55000055")
            .show(true);
    */
    
    ui.toast("Sensors_not_detected!!" + "\n" + "Please connect sensors before calibrating them");
    }
    
  
});

function update_sensors_ends(){
    
    
    //  ******** ------------ TODO --------------------
    
    var cnt = 0;
    
    // ParseInt raw data and copy to copy data to Max/min ends array where appropriate:
    for(cnt=0; cnt<sensor_raw.length; cnt++){
        sensor_raw[cnt] = parseInt(sensor_raw[cnt]);
        sensor_plot_draw[cnt] = sensor_raw[cnt];
        if(sensor_raw[cnt] >= sensor_raw_max[cnt]) sensor_raw_max[cnt] = sensor_raw[cnt];
        if(sensor_raw[cnt] <= sensor_raw_min[cnt]) sensor_raw_min[cnt] = sensor_raw[cnt];
    }
    
    // Convert actuator_data array of integers to and string max_string to send to bluetooth:
    var max_string = "";
    for(cnt=0; cnt<sensor_raw_max.length; cnt++){
        max_string += sensor_raw_max[cnt];
        max_string += ";";
    }  
    
    txt2.text("max_string:   " + "\t" + max_string + "\n");
    
    // Convert actuator_data array of integers to and string max_string to send to bluetooth:
    var min_string = "";
    for(cnt=0; cnt<sensor_raw_min.length; cnt++){
        min_string += sensor_raw_min[cnt];
        min_string += ";";
    }  
    
    txt3.text("min_string:   " + "\t" + min_string + "\n");    
}