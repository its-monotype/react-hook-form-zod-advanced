import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

const phoneRegex = new RegExp(
  /^([+]?[\s0-9]+)?(\d{3}|[(]?[0-9]+[)])?([-]?[\s]?[0-9])+$/,
);

const formSchema = z
  .object({
    name: z.string().min(1, { message: 'Required' }),
    age: z.number().min(10, { message: 'Must be at least 10 years old' }),
    phone: z.string().regex(phoneRegex, 'Invalid').optional().or(z.literal('')),
    website: z
      .string()
      .toLowerCase()
      .min(5, { message: 'Must be a minimum of 5 characters' })
      .refine((v) => v.indexOf('.') !== -1, { message: 'Invalid' })
      .optional()
      .or(z.literal('')),
    dateOfBirth: z
      .date()
      .max(new Date(Date.now() - 10 * 365 * 24 * 60 * 60 * 1000), {
        message: 'Must be at least 10 years old',
      }),
    avatar: z
      .instanceof(File, { message: 'Required' })
      .refine((f) => f.type.startsWith('image/'), {
        message: 'Invalid file type',
      })
      .refine((f) => f.size <= 5 * 1024 * 1024, {
        message: 'Image size must be less than 5MB',
      }),
    additionalPictures: z
      .array(
        z
          .instanceof(File)
          .refine((f) => f.type.startsWith('image/'), {
            message: 'Invalid file type',
          })
          .refine((f) => f.size <= 50 * 1024 * 1024, {
            message: 'Image size must be less than 50MB',
          }),
      )
      .max(5, { message: 'Maximum 5 images allowed' })
      .optional(),
  })
  .superRefine((values, ctx) => {
    const { age, dateOfBirth } = values;

    if (age !== undefined && dateOfBirth !== undefined) {
      const calculatedAge = Math.floor(
        (Date.now() - new Date(dateOfBirth).getTime()) /
          (1000 * 60 * 60 * 24 * 365),
      );

      if (age !== calculatedAge) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Age must match date of birth',
          path: ['age'],
        });
      }
    }
  });

type FormValues = z.infer<typeof formSchema>;

export const App = () => {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });
  const [avatarPreview, setAvatarPreview] = useState<string>();
  const [additionalPicturesPreviews, setAdditionalPicturesPreviews] =
    useState<string[]>();

  return (
    <form
      className="flex flex-col gap-2 max-w-lg"
      onSubmit={handleSubmit((d) => console.log(d))}
    >
      <input placeholder="Name" {...register('name')} />
      {errors.name?.message && <p>{errors.name?.message}</p>}
      <input
        type="number"
        placeholder="Age"
        {...register('age', {
          setValueAs: (v) => (v === '' ? undefined : parseInt(v, 10)),
        })}
      />
      {errors.age?.message && <p>{errors.age?.message}</p>}
      <input
        type="date"
        {...register('dateOfBirth', {
          setValueAs: (v) => (v === '' ? undefined : new Date(v)),
        })}
      />
      {errors.dateOfBirth?.message && <p>{errors.dateOfBirth?.message}</p>}
      <input type="tel" placeholder="Phone number" {...register('phone')} />
      {errors.phone?.message && <p>{errors.phone?.message}</p>}
      <input placeholder="Website" {...register('website')} />
      {errors.website?.message && <p>{errors.website?.message}</p>}
      <Controller
        name="avatar"
        control={control}
        render={({ field: { onChange } }) => (
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              if (e.target.files === null) return;
              const file = e.target.files[0];
              onChange(file);
              if (!file.type.startsWith('image/')) return;
              setAvatarPreview(file ? URL.createObjectURL(file) : undefined);
            }}
          />
        )}
      />
      {avatarPreview && (
        <img className="w-20" src={avatarPreview} alt="Avatar" />
      )}
      {errors.avatar?.message && <p>{errors.avatar?.message}</p>}
      <Controller
        name="additionalPictures"
        control={control}
        render={({ field: { onChange } }) => (
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              if (e.target.files === null) return;
              const files = Array.from(e.target.files);
              onChange(files);
              if (!files.every((f) => f.type.startsWith('image/'))) return;
              setAdditionalPicturesPreviews(
                files.length
                  ? files.map((f) => URL.createObjectURL(f))
                  : undefined,
              );
            }}
          />
        )}
      />
      {errors.additionalPictures?.message && (
        <p>{errors.additionalPictures?.message}</p>
      )}
      {additionalPicturesPreviews && (
        <div className="flex gap-2 items-center">
          {additionalPicturesPreviews.map((p) => (
            <img key={p} className="w-20" src={p} alt="" />
          ))}
        </div>
      )}
      <button>Submit</button>
    </form>
  );
};
