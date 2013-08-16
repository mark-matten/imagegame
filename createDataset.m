%{
Matlab code for creating the image datasets for both players and the the
text file with image names and object locations.  createDataset requires
that your image files and annotation files follow these guidelines:

Images files should be named according to the desired target object.  For
example, if you want bounding boxes to be drawn around the cars in an
image, the file name should be 'car1.jpg', 'car2.jpg', etc., with no repeat
file names.  These image files should be stored in a folder 'Images', which
is in a folder 'gameImages' on the Desktop.  A folder 'finalGameImages'
will be created in 'gameImages' to store the game images used for player 1
and player 2.

Annotation files should have the same file name as the respective image
file.  Inside the annotation file, the contents of <filename> ___
</filename> must be changed to the same file name as the image, such as
'car1.jpg'.  The contents of <folder> ___ </folder> must be changed to
'Images'.

If anyone needs any help getting this working, please contact me.  Also, I'm
happy to set up an image dataset for anyone who wants to create their own.
If you want me to do this for you, please send me a folder with the images
and the corresponding LabelMe annotation files, and I can create the
dataset and the text file for you.

%}

clc;
clear;

% Setup database
HOMEIMAGES = 'C:/Users/USERNAME/Desktop/gameImages';
HOMEANNOTATIONS = 'C:/Users/USERNAME/Desktop/gameAnnotations';
D = LMdatabase(HOMEANNOTATIONS);

Nimages = length(D);

% Create file where image names and object locations will be written
fileWrite = fopen('testWriteFile.txt', 'wt');

for i = 1:Nimages
    
    fileName = D(i).annotation.filename;
    objectName = fileName(1:end-4); % Remove .jpg from end of file name
    
    % Get name of object from the name of the image
    while str2double(objectName(end)) >= 0 && str2double(objectName(end)) <= 9
        objectName = objectName(1:end-1);
    end
    
    if strcmp(objectName, 'people')
        objectName = 'person';
    end
    
    objectName = strcat(objectName, ' - crop - part - occluded'); 
    
    if strcmp(objectName, 'car')
        objectName = strcat(objectName, ' - top - front - back + SUV');
    end
    
    img = LMimread(D, i, HOMEIMAGES); % Load the actual image
  
    nrows = size(img, 1);
    ncols = size(img, 2);
    Nobjects = length(D(i).annotation.object);
    ni = 0;
    maskpol = logical(zeros(nrows, ncols, Nobjects));
  
    jc = LMobjectindex(D(i).annotation, objectName);
    for n = 1:length(jc)
        [X,Y] = getLMpolygon(D(i).annotation.object(jc(n)).polygon);
        ni = ni+1;
        maskpol(:,:,ni) = poly2mask(double(X),double(Y),double(nrows),double(ncols));
    end
    
    maskpol = maskpol(:,:,1:ni);
    maskpol = uint8(maskpol);
    
    for j = 1:size(maskpol, 3) 
        
        xMin = 0;
        yMin = 0;
        xMax = size(maskpol, 2);
        yMax = size(maskpol, 1);      
        
        for y = 1:size(maskpol, 1)
            if yMin == 0 && sum(maskpol(y, :, j)) > 0
                yMin = y;
            end
            if yMax == size(maskpol, 1) && sum(maskpol(size(maskpol, 1) - y, :, j)) > 0
                yMax = size(maskpol, 1) - y;
            end
            if yMin ~= 0 && yMax ~= size(maskpol, 1)
                break;
            end
        end
        
        for x = 1:size(maskpol, 2)
            if xMin == 0 && sum(maskpol(:, x, j)) > 0
                xMin = x;
            end
            if xMax == size(maskpol, 2) && sum(maskpol(:, size(maskpol, 2) - x, j)) > 0
                xMax = size(maskpol, 2) - x;
            end
            if xMin ~= 0 && xMax ~= size(maskpol, 2)
                break;
            end
        end
        
        % Save image with rectangle over object
        f = figure('visible','off');
        imshow(img, 'Border', 'tight');
        rectangle('Position', [xMin, yMin, xMax - xMin, yMax - yMin], 'LineWidth', 3, 'EdgeColor','r');
        print(f, '-r80', '-djpeg', strcat('C:/Users/Mark/Desktop/gameImages1/finalGameImages/ImagesP1/', fileName(1:end-4), '_', int2str(j), '.jpg'));

        name = strcat(fileName(1:end-4), '_', int2str(j), '.jpg', ', ', num2str(xMin / ncols), ', ', num2str(xMax / ncols), ', ', num2str(yMin / nrows), ', ', num2str(yMax / nrows), '\n');    
        fprintf(fileWrite, name);
 
    end
    
    scaledImage = imresize(img, [nrows, ncols]);
    f1 = figure('visible','off');
    imshow(scaledImage, 'Border', 'tight');
    print(f1, '-r80', '-djpeg', strcat('C:/Users/Mark/Desktop/gameImages1/finalGameImages/ImagesP2/', fileName));

end

fclose(fileWrite);
