<?php
   $json = $_POST['json'];
   $fileName = $_POST['fileName'];
   $path = $_POST['path'];

   /* sanity check */
   if (json_decode($json) != null)
   {
     $file = fopen($path . $fileName . '.json', 'w+');
     fwrite($file, $json);
     fclose($file);
   }
   else
   {
     // invalid JSON, shouldn't happen -_-
   }
?>