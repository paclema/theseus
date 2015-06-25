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

