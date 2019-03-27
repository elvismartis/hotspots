/* Functions needed for running the NGL script */

function loadSingleFile(f,loaded_promises){
    console.log(f)
    var file_extension=f.name.split('.').pop()

    if (file_extension=='pdb'){

        proteinRepresentation(f,loaded_promises)

    }else if (file_extension=='ccp4'){

        mapRepresentation(f,loaded_promises);

    }else if (file_extension == 'zip'){

        unzipBlob(f, loadSingleFile, loaded_promises)
    }
    else{
        console.log("Unknown file extension")
        return
    }
};

// Counts how many files we expect to load
function count_expected_loaded_promises(all_files){
   count = 0
   for (var i=0; i< all_files.length; i++){
        var curr_name = all_files[i].name

        if (curr_name.includes(".pdb")){
            count+=1

        }else if (curr_name.includes(".ccp4")){
            if (curr_name.includes(".buriedness")){
                count +=1
            }
        }else continue

   }
   return count
}

// Checks if file will be loaded based on the filename
function check_filename(fname){
    if (fname.includes(".pdb")){return true

    }else if (fname.includes(".ccp4")){

        if(!fname.includes("buriedness")){return true

        }else{ return false}

    }else return false

}


/*Loading zip files - taken from zip.js documentation */
function unzipBlob(blob,callback, loaded_promises) {
  zip.useWebWorkers = false
  // use a zip.BlobReader object to read zipped data stored into blob variable
  zip.createReader(new zip.BlobReader(blob), function(zipReader) {
    // get entries from the zip file
    zipReader.getEntries(function(entries) {
      // get data from the first file
      //console.log(entries[0].filename)
      //expected_loaded_promises = count_expected_loaded_promises(entries)
      entries.forEach(function(element){
          //var fname = entries[i].filename
          if(check_filename(element.filename)){
          expected_loaded_promises += 1}

          element.getData(new zip.BlobWriter(), function(data){
                self=this;
                file=new File([data], self.fname)
                // close the reader and calls callback function with uncompressed data as parameter
                zipReader.close();
                callback(file,loaded_promises)
          }.bind({fname: element.filename}))
          //console.log(a)
      });
     //zipReader.close();
    });
  }, onerror);
};

function onerror(message) {
  console.error(message);
}


function log(loaded_objects){
    console.log(loaded_objects)
    return loaded_objects
}


/* Representation and visualisation functions*/

function proteinRepresentation(f,loaded_promises){
     var promise_loaded=stage.loadFile( f ).then(function (o) {
        o.addRepresentation("cartoon")
        o.addRepresentation( "ball+stick", {
            //Show ligands if present
            sele: "(( not polymer or hetero ) and not ( water or ion ))",
            scale: 0.5
        })
        o.autoView()
        return o;
    })

    loaded_promises.push(promise_loaded);

}


function mapRepresentation(f,loaded_promises){
                if (f.name.includes("acceptor")){
                    var c = "red"

                }else if (f.name.includes("donor")){
                    var c = "blue"

                }else if(f.name.includes("apolar")){
                    var c = "#FFF176"

                }else if(f.name.includes("positive")){
                    var c = "magenta"

                }else if(f.name.includes("negative")){
                    var c = "cyan"

                }else{
                    console.log('Unrecognised probe type for', f.name)
                    return
                }


            var surface_properties={color: c,
                isolevelType: "value",
                isolevel: 14.0,
                opacity: 0.9,
                };

            var dot_properties = {thresholdType:'value',
                thresholdMin: 14.0,
                color: c,
                dotType:'sphere',
                radius: 0.3,
                opacity:1.0,
                visible:false};


            var promise_loaded=stage.loadFile( f ).then(function (o ) {
                o.addRepresentation("surface", surface_properties);
                o.addRepresentation("dot", dot_properties);
                return o;
             });

            loaded_promises.push(promise_loaded);
    };



function runFunctionOnAllObjects(func_to_run, external_parameter){
    //func_to_run - any function from custom_functions.js
    //object_array = [loaded_objects]
    try{
        final_promise=final_promise.then(function(object_array){
            if (external_parameter!=null){
                object_array=func_to_run(object_array,external_parameter)
            }else{
                object_array=func_to_run(object_array)
            }
            return object_array
        });
    }
    catch (err){
        console.log('You need to put a comma after the function name')
        return object_array
    }
   }



// Functions that interact with views

function set_surface_isolevel(loaded_objects, grid_params){
    /*
    grid_params: {}
    grid_params[grid_type]: str, "donor", "acceptor", "apolar, "positive", "negative"
    grid_params[isolevel]: float, target contour level
    */
    for (var i=0; i< loaded_objects.length; i++){
        if (loaded_objects[i].name.includes(grid_params.grid_type)){
            for (var r=0; r<loaded_objects[i].reprList.length; r++){
                if(loaded_objects[i].reprList[r].name == "surface"){
                    loaded_objects[i].reprList[r].setParameters({isolevel:grid_params.isolevel})
                }
            }
        }
    }

    for (var k=0;k<loaded_objects.length;k++){
        loaded_objects[k].updateRepresentations({position:true})
    }
    return loaded_objects
    }

function set_dot_threshold(loaded_objects, grid_params){
    /*
    grid_params: {}
    grid_params[grid_type]: str, "donor", "acceptor", "apolar", "positive", "negative"
    grid_params[threshold_min]: float, min contour level
    */
    for (var i=0; i< loaded_objects.length; i++){
        if (loaded_objects[i].name.includes(grid_params.grid_type)){
            for (var r=0; r<loaded_objects[i].reprList.length; r++){
                if(loaded_objects[i].reprList[r].name == "dot"){
                    loaded_objects[i].reprList[r].setParameters({thresholdMin: grid_params.threshold_min})
                }
            }
        }
    }

    for (var k=0;k<loaded_objects.length;k++){
        loaded_objects[k].updateRepresentations({position:true})
    }
    return loaded_objects
    }

function toggle_visibility(loaded_objects, params){
    /*params: {}
    params.visibility: bool, true for visible
    params.type: str, "surface", "dots", "cartoon", "lines", "liquorice", "ball+stick"
    params.selection: str, any other selections
    */

    if (typeof params.selection === "undefined"){
        params.selection=""}

    for (var i=0; i< loaded_objects.length; i++){
        if (loaded_objects[i].name.includes(params.selection)){
            for (var r=0; r<loaded_objects[i].reprList.length; r++){
                if(loaded_objects[i].reprList[r].name == params.type){
                    loaded_objects[i].reprList[r].setVisibility(params.visibility)
                    }
                }
            }
        }

    for (var k=0;k<loaded_objects.length;k++){
        loaded_objects[k].updateRepresentations({position:true})
        }
    return loaded_objects
    }

